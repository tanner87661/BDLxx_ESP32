void establishWifiConnection(AsyncWebServer * webServer,DNSServer * dnsServer)
{
    AsyncWiFiManager wifiManager(webServer,dnsServer);
    //reset settings - for testing
    //wifiManager.resetSettings();

    if (useStaticIP) //set static IP information, if DHCP is not used for STA connection
    {
      Serial.println("Set Static IP Mode");
      wifiManager.setSTAStaticIPConfig(static_ip, static_gw, static_nm, static_dns);
    }

    if ((wifiCfgMode & 0x01) > 0)  //STA mode is used, so wifiManager can handle AP selection and password
    {
        //sets timeout until configuration portal gets turned off
        //useful to make it all retry or go to sleep
        //in seconds
        wifiManager.setTimeout(120); 
        if (!wifiManager.autoConnect("IoTT_ESP32"))
        {
          Serial.println("failed to connect and hit timeout, setting up AP, if configured, otherwise restart ESP32");
          wifiCfgMode  &= 0xFE;        //clear STA Mode
        }
    }
     
    if ((wifiCfgMode & 0x02) > 0) //if AP is needed, define the AP settings
    {
      wifiManager.setAPStaticIPConfig(ap_ip, ap_ip, ap_nm);
      WiFi.softAPConfig(ap_ip, ap_ip, ap_nm);
      WiFi.softAP(devName.c_str(), apPassword.c_str());
      Serial.println(" Set Access Point Mode");
    }
    switch (wifiCfgMode) //set the wifi mode, STA, AP or both
    {
      case 0x00: ESP.restart(); break; //no more options left, just restart the module
      case 0x01 : WiFi.mode(WIFI_STA); break;
      case 0x02 : WiFi.mode(WIFI_AP); break;
      case 0x03 : WiFi.mode(WIFI_AP_STA); break;
      default: ESP.restart(); break; //no more options left, just restart the module
    }
}

void checkWifiTimeout() //check if wifi can be switched off
{
  if (!wifiCancelled)
    if (!wifiAlwaysOn)
      if (millis() > (lastWifiUse + wifiShutTimeout))
      {
        wifiCancelled = true;
        WiFi.disconnect(); 
        WiFi.mode(WIFI_OFF);
//        WiFi.forceSleepBegin();
        delay(1); 
        Serial.println("Wifi disabled. Reset device to re-enable");
      }
}


void getInternetTime() //periodically connect to an NTP server and get the current time
{
  
  int thisIntervall = ntpIntervallDefault;
  if (!ntpOK)
    thisIntervall = ntpIntervallShort;
  if (millis() > (ntpTimer + thisIntervall))
  {
    if (WiFi.status() == WL_CONNECTED)
    {
      time(&now);
      localtime_r(&now, &timeinfo);
      if (timeinfo.tm_year <= (2016 - 1900)) // the NTP call was not successful
      {
        ntpOK = false;
        return;
      }
      ntpTimer = millis();
      char time_output[30];
      strftime(time_output, 30, "%a  %d-%m-%y %T", localtime(&now));
      Serial.println(time_output);
      ntpOK = true;
    }
  }
}
