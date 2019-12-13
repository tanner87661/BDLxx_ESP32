const String BBVersion = "1.1.0";

//#define measurePerformance //uncomment this to display the number of loop cycles per second

//Arduino published libraries. Install using the Arduino IDE or download from Github and install manually
#include <arduino.h>
#include <EEPROM.h> //standard library, can be installed in the Arduino IDE
#include <WiFi.h>
#include <time.h>
#include <ESPAsyncWebServer.h>
#include <DNSServer.h>
#include <ESPAsyncWiFiManager.h>         //https://github.com/alanswx/ESPAsyncWiFiManager
#include <SPIFFS.h>
#define FORMAT_SPIFFS_IF_FAILED true
#include <ArduinoJson.h> //standard JSON library, can be installed in the Arduino IDE. Make sure to use version 6.x
#include <Adafruit_VL53L0X.h>
#include <wire.h>

//following libraries can be downloaded from https://github.com/tanner87661?tab=repositories
#include <IoTT_DigitraxBuffers.h> //as introduced in video # 30
#include <IoTT_LEDChain.h> //as introduced in video # 30
#include <IoTT_LocoNetHBESP32.h> //this is a hybrid library introduced in video #29
#include <IoTT_MQTTESP32.h> //as introduced in video # 29
#include <OneDimKalman.h>

//library object pointers. Libraries will be dynamically initialized as needed during the setup() function
AsyncWebServer * myWebServer = NULL; //(80)
DNSServer * dnsServer = NULL;
//WiFiClientSecure * wifiClientSec = NULL;
WiFiClient * wifiClient = NULL;
AsyncWebSocket * ws = NULL; //("/ws");
AsyncWebSocketClient * globalClient = NULL;
uint16_t wsReadPtr = 0;
char wsBuffer[16384]; //should this by dynamic?

//global variables
bool useStaticIP = false;
IPAddress static_ip;
IPAddress static_gw;
IPAddress static_nm;
IPAddress static_dns;
IPAddress ap_ip;
IPAddress ap_nm(255,255,255,0);

uint8_t wifiCfgMode = 0x00; //1: STA, 2: AP, 3: STA+AP
String devName; //device name used for AP, will load from node.cfg
String apPassword; //AP password, will load from node.cfg

bool wifiAlwaysOn = true; //set to false to shut Wifi after some time of inactivity. Gateway and MQTT should be disabled, though
bool wifiCancelled = false; //true if Wifi was switched off due to no use
uint32_t lastWifiUse = millis();
#define wifiShutTimeout 120000 //after 2 Mins of not using, Wifi is closed
#define keepAliveInterval 30000 //send message every 30 secs to keep connection alive
uint32_t keepAlive = millis(); //timer used for periodic message sent over wifi to keep alive while browser is connected. Sent over websocket connection

//more library object pointers. Libraries will be dynamically initialized as needed during the setup() function
LocoNetESPSerial * lnSerial = NULL;
IoTT_ledChain * myChain = NULL;
MQTTESP32 * lnMQTT = NULL;

Adafruit_VL53L0X lox = Adafruit_VL53L0X(); //default address 0x29
VL53L0X_RangingMeasurementData_t measure;
uint16_t echoDistance;
OneDimKalman distKalman;

//some variables used for performance measurement
#ifdef measurePerformance
uint16_t loopCtr = 0;
uint32_t myTimer = millis() + 1000;
#endif

//********************************************************Hardware Configuration******************************************************
#define LED_DATA_PIN 12 //this is used to initialize the FastLED template
//***********************************************************************************************************************************

//global variables for the NTP module
int ntpTimeout = 5000; //ms timeout for NTP update request
char ntpServer[50] = "us.pool.ntp.org"; //default server for US. Change this to the best time server for your region, or set in node.cfg
char ntpTimeZone[100] = "EST5EDT";  // default for Eastern Time Zone. Enter your time zone from here: (https://remotemonitoringsystems.ca/time-zone-abbreviations.php) into node.cfg
bool ntpOK = false;
bool useNTP = false;
tm timeinfo;
time_t now;
const uint32_t ntpIntervallDefault = 86400000; //1 day in milliseconds
const uint32_t ntpIntervallShort = 10000; //10 Seconds in case something went wrong
uint32_t ntpTimer = millis();

//commMode: 1: LocoNet, 2: MQTT
//workMode: 1: ALM
uint8_t commMode = 0xFF;
uint8_t modMode = 0xFF;

File uploadFile; //used for web server to upload files

//this is the outgoing communication function for IoTT_DigitraxBuffers.h, routing the outgoing messages to the correct interface
uint16_t sendMsg(lnTransmitMsg txData)
{
  switch (commMode)
  {
    case 1: if (lnSerial) lnSerial->lnWriteMsg(txData); break;
    case 2: if (lnMQTT) lnMQTT->lnWriteMsg(txData); break;
  }
}

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);

  Serial.println("Init SPIFFS");
  SPIFFS.begin(); //File System. Size is set to 1 MB during compile time and loaded with configuration data and web pages

  myWebServer = new AsyncWebServer(80);
  dnsServer = new DNSServer();
  wifiClient = new WiFiClient();
  uint16_t wsRequest = 0;
  ws = new AsyncWebSocket("/ws");

  DynamicJsonDocument * jsonConfigObj = NULL;
  DynamicJsonDocument * jsonDataObj = NULL;
  jsonConfigObj = getDocPtr("/configdata/node.cfg"); //read and decode the master config file. See ConfigLoader tab
  if (jsonConfigObj != NULL)
  {
    //first, read all Wifi Paramters
    if (jsonConfigObj->containsKey("wifiMode"))
      wifiCfgMode = (*jsonConfigObj)["wifiMode"];
    Serial.println(wifiCfgMode);
    if (jsonConfigObj->containsKey("useWifiTimeout"))
      wifiAlwaysOn =  (!(bool)(*jsonConfigObj)["useWifiTimeout"]);
    if (jsonConfigObj->containsKey("devName"))
    {
      String thisData = (*jsonConfigObj)["devName"];
      devName = thisData;
    }
    if ((*jsonConfigObj)["inclMAC"])
      devName += String((uint32_t)ESP.getEfuseMac());
    if ((*jsonConfigObj)["useStaticIP"])
      useStaticIP = (bool)(*jsonConfigObj)["useStaticIP"];
    if (useStaticIP && jsonConfigObj->containsKey("staticConfig"))
    {
      String thisIP = (*jsonConfigObj)["staticConfig"]["staticIP"];
      static_ip.fromString(thisIP);
      String thisGW = (*jsonConfigObj)["staticConfig"]["staticGateway"];
      static_gw.fromString(thisGW);
      String thisNM = (*jsonConfigObj)["staticConfig"]["staticNetmask"];
      static_nm.fromString(thisNM);
      String thisDNS = (*jsonConfigObj)["staticConfig"]["staticDNS"];
      static_dns.fromString(thisDNS);
    }

    if (((wifiCfgMode && 0x02) > 0) && jsonConfigObj->containsKey("apConfig"))
    {
      String thisIP = (*jsonConfigObj)["apConfig"]["apGateway"];
      ap_ip.fromString(thisIP);
      String thisPW = (*jsonConfigObj)["apConfig"]["apPassword"];
      apPassword = thisPW;
    }

    if (jsonConfigObj->containsKey("commMode"))
      commMode = (*jsonConfigObj)["commMode"];
    if (jsonConfigObj->containsKey("workMode"))
      modMode = (*jsonConfigObj)["workMode"];

    if ((commMode == 1) || ((commMode == 3) && (modMode == 1))) //LocoNet or Gateway/ALM
    {
      Serial.println("Init LocoNet");  
      lnSerial = new LocoNetESPSerial((*jsonConfigObj)["LnModConfig"]["pinRx"], (*jsonConfigObj)["LnModConfig"]["pinTx"], (*jsonConfigObj)["LnModConfig"]["invLogic"]); //true is inverted signals
      lnSerial->setBusyLED((*jsonConfigObj)["LnModConfig"]["busyLEDPin"]);
      lnSerial->setLNCallback(callbackLocoNetMessage);
    } 
    else 
      Serial.println("LocoNet not activated");

    if (jsonConfigObj->containsKey("LidarConfig"))
    {
      uint8_t pinSDA = (*jsonConfigObj)["LidarConfig"]["lidarSDA"];
      uint8_t pinSCL = (*jsonConfigObj)["LidarConfig"]["lidarSCL"];
      Serial.println(pinSDA, pinSCL);
      Wire.begin(pinSDA, pinSCL); //SDA, SCL. frequency 18/19
      Wire.setClock(100000);
      delay(100);
      Serial.println("Adafruit VL53L0X test");
      if (!lox.begin()) 
      {
        Serial.println(F("Failed to boot VL53L0X, restart chip"));
        delay(500);
        ESP.restart();
      }
      Serial.println("Load Block Detector Data");  
      jsonDataObj = getDocPtr("/configdata/bdl.cfg");
      if (jsonDataObj != NULL)
      {
        initTriggers(*jsonDataObj);
        delete(jsonDataObj);
      }
    }
      
    if ((wifiAlwaysOn) && ((commMode == 2) || (commMode == 3) && (modMode == 1))) //MQTT or Gateway/ALM
    {
      Serial.println("Load MQTT Data");  
      jsonDataObj = getDocPtr("/configdata/mqtt.cfg");
      if (jsonDataObj != NULL)
      {
        lnMQTT = new MQTTESP32(*wifiClient); 
        lnMQTT->loadMQTTCfgJSON(*jsonDataObj);
        lnMQTT->setMQTTCallback(callbackLocoNetMessage);
        delete(jsonDataObj);
      }
    }
    else 
      Serial.println("MQTT not activated");

    setTxFunction(&sendMsg); //defined in IoTT_DigitraxBuffers.h

    if (jsonConfigObj->containsKey("useLEDModule"))
    {
      if ((bool)(*jsonConfigObj)["useLEDModule"])
      {
        Serial.println("Load LED Data"); 
        jsonDataObj = getDocPtr("/configdata/led.cfg");
        if (jsonDataObj != NULL)
        {
          myChain = new IoTT_ledChain(); // ... construct now, and call setup later
          myChain->loadLEDChainJSON(*jsonDataObj);
          delete(jsonDataObj);
//          Serial.println("Init LED Chain");  
          const char thisPin = 12;//(*jsonConfigObj)["LEDDataPin"];
          FastLED.addLeds<WS2811, LED_DATA_PIN, GRB>(myChain->getChain(), myChain->getChainLength());
        }
      }
      else 
        Serial.println("LED Module not activated");
    }
    Serial.println("Connect WiFi");  
    establishWifiConnection(myWebServer,dnsServer);
    if (lnMQTT)
    {
      Serial.println("Connect MQTT");  
      establishMQTTConnection();
      Serial.println("Connect MQTT done");  
    }
    if (jsonConfigObj->containsKey("useNTP"))
    {
      useNTP = (bool)(*jsonConfigObj)["useNTP"];
      if (useNTP)
      {
        Serial.println("Create NTP Time Access");  
        JsonObject ntpConfig = (*jsonConfigObj)["ntpConfig"];
        if (ntpConfig.containsKey("NTPServer"))
          strcpy(ntpServer, ntpConfig["NTPServer"]);
        if (ntpConfig.containsKey("ntpTimeZone"))
          if (ntpConfig["ntpTimeZone"].is<const char*>())
            strcpy(ntpTimeZone, ntpConfig["ntpTimeZone"]);
          else
            Serial.println("ntpTimeZone is wrong data type");
        configTime(0, 0, ntpServer);
        setenv("TZ", ntpTimeZone, 1);
      }
      else 
        Serial.println("NTP Module not activated");
    }
    delete(jsonConfigObj);
    if (useNTP) getInternetTime();
    startWebServer();
    Serial.println(String(ESP.getFreeHeap()));
  }
  else
    Serial.println("node.cfg not loaded"); 
  distKalman.setInitValues(8,10,10,10);
  randomSeed((uint32_t)ESP.getEfuseMac()); //initialize random generator with MAC
}

void loop() {
  // put your main code here, to run repeatedly:
#ifdef measurePerformance
  loopCtr++;
  if (millis() > myTimer)
  {
    Serial.printf("Timer Loop: %i\n", loopCtr);
//    Serial.printf("Distance (mm): %i \n", echoDistance); 
    loopCtr = 0;
    myTimer += 1000;
  }
#endif  

  if (myChain) myChain->processChain(); //updates all LED's based on received status information for switches, inputs, buttons, etc.

  checkWifiTimeout(); //checks if wifi has been inactive and disables it after timeout
  if (!wifiCancelled) //handles keep alive updates as long connection is valid
  {
    if (WiFi.status() == WL_CONNECTED)
    { 
      sendKeepAlive();
      if (useNTP)
        getInternetTime(); //gets periodic updates of date and time from NTP server
    }
    else
    {
      Serial.println("Reconnect WiFi");
      establishWifiConnection(myWebServer,dnsServer);
    }
  }
  if (!wifiCancelled && lnMQTT) //handles all wifi communication for MQTT
    if (WiFi.status() == WL_CONNECTED)
    { 
      if (lnMQTT) 
        lnMQTT->processLoop();
    }
    else
    {
      Serial.println("Reconnect WiFi");
      establishWifiConnection(myWebServer,dnsServer);
    }
  else
    if (lnSerial) 
      lnSerial->processLoop(); //handling all LocoNet communication

  lox.rangingTest(&measure, false); // pass in 'true' to get debug data printout!
  uint16_t thisDistance = measure.RangeMilliMeter;
  echoDistance = round(distKalman.getEstimate(thisDistance));
  processTriggers(echoDistance);
  processBufferUpdates(); //updating DigitraxBuffers by querying information from LocoNet, e.g. slot statuses
}
