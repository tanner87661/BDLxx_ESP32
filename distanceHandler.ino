typedef struct
{
  uint16_t distThreshold = 0;
  uint16_t inpRepNr = 0;
  uint8_t  triggerStatus = 0x00;
  
} triggerEntry;

triggerEntry * triggerList = NULL;
uint8_t triggerEntryLen = 0;

uint16_t pgUpdateInterval = 1000; //limit WS traffic to 4 messages per second to avoid buffer overrrun
uint32_t nextUpdate = millis() + pgUpdateInterval;

void initTriggers(DynamicJsonDocument doc)
{
  if (doc.containsKey("sendAnalog"))
    sendAnalogMsg = doc["sendAnalog"];
  if (doc.containsKey("analogAddr"))
    analogAddr = doc["analogAddr"];
  if (doc.containsKey("maxDistance"))
    maxAnalogRange = doc["maxDistance"];
  if (doc.containsKey("txThreshold"))
    distMsgThreshold = doc["txThreshold"];
  if (doc.containsKey("BDTriggers"))
  {
    JsonArray BDTriggers = doc["BDTriggers"];
    triggerEntryLen = BDTriggers.size();
    triggerList = (triggerEntry*) realloc (triggerList, triggerEntryLen * sizeof(triggerEntry));
    for (int i=0; i < triggerEntryLen; i++)
    {
      triggerEntry * thisTriggerEntry = &triggerList[i];
      thisTriggerEntry->distThreshold = (BDTriggers[i]["Distance"]);
      thisTriggerEntry->inpRepNr = (BDTriggers[i]["InpRepNr"]);
    }
  }
}

void processTriggers(uint16_t currDistance)
{
  if (triggerList)
    for (int i=0; i < triggerEntryLen; i++)
    {
      if (triggerList[i].distThreshold > currDistance)
        triggerList[i].triggerStatus |= 0x01;
      else
        triggerList[i].triggerStatus &= ~0x01;

      if ((triggerList[i].triggerStatus & 0x01) != ((triggerList[i].triggerStatus & 0x10) >> 4))
      {
//        Serial.printf("Send BD %i %i \n", triggerList[i].inpRepNr, triggerList[i].triggerStatus & 0x01);
        sendBlockDetectorCommand(triggerList[i].inpRepNr, triggerList[i].triggerStatus & 0x01);
        triggerList[i].triggerStatus ^= 0x10;
//        break;
      }
    }
  if (millis() > nextUpdate)
  {
    if (globalClient != NULL)
    {
//      Serial.println("Update Web");
      DynamicJsonDocument doc(400);
      char myMqttMsg[100];
      doc["Cmd"] = "LOX";
      JsonArray data = doc.createNestedArray("Data");
      data.add(currDistance);
      serializeJson(doc, myMqttMsg);
      globalClient->text(myMqttMsg);
      lastWifiUse = millis();
    }
    nextUpdate += pgUpdateInterval;
    if (nextUpdate < millis())
      nextUpdate = millis() + pgUpdateInterval;
  }
//  Serial.printf("Analog Data: Curr: %i max %i lastVal %i Thresh: %i\n", currDistance, maxAnalogRange, lastAnalogValue, distMsgThreshold);
  if (sendAnalogMsg && (abs(min(currDistance, maxAnalogRange) - lastAnalogValue) > distMsgThreshold))
  {
    Serial.println("Send Analog");
    lastAnalogValue = min(currDistance, maxAnalogRange);
    uint16_t txValue = trunc(4095 / maxAnalogRange * lastAnalogValue);
    onAnalogData(analogAddr, txValue);
  }
}

void requestStatusUpdate(uint16_t bdlAddr)
{
  
}
