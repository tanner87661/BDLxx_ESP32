//read config files and build object lists for colors, block detectors, switches, buttons, signals etc. 
//this is all dynamic, allocated on the heap when the program is starting up
////////////////////////////////////////////////Config File Loading////////////////////////////////////////////////////////////////////

String readFile(String fileName)
{
  String jsonData = "";
  if (SPIFFS.exists(fileName))
  {
    File dataFile = SPIFFS.open(fileName, "r");
    if (dataFile)
    {
      while (dataFile.position() < dataFile.size())
      {
        jsonData = jsonData + dataFile.readStringUntil('\n');
        jsonData.trim();
      } 
      dataFile.close();
    }
  } else Serial.println("File not found");
  return jsonData;
}

bool writeJSONFile(String fileName, DynamicJsonDocument * writeThis)
{
  String fileStr;
  serializeJson(*writeThis, fileStr);
  Serial.println(fileStr);
  Serial.println("Writing Node Config File");
  File dataFile = SPIFFS.open(fileName, "w");
  if (dataFile)
  {
    dataFile.println(fileStr);
    dataFile.close();
    Serial.println("Writing Config File complete");
    return true;
  }
  else
    return false;
}

bool writeJSONFile(String fileName, String fileStr)
{
  Serial.println(fileStr);
  Serial.println("Writing Node Config File");
  File dataFile = SPIFFS.open(fileName, "w");
  if (dataFile)
  {
    dataFile.println(fileStr);
    dataFile.close();
    Serial.println("Writing Config File complete");
    return true;
  }
  else
    return false;
}

DynamicJsonDocument * getDocPtr(String cmdFile)
{
  String jsonData = readFile(cmdFile);
  if (jsonData != "")
  {
    uint16_t docSize = 3 * jsonData.length();
    DynamicJsonDocument * thisDoc = new DynamicJsonDocument(docSize);
    DeserializationError error = deserializeJson(*thisDoc, jsonData);
    if (!error)
      return thisDoc;
    else
      return NULL;
  }
  else
      return NULL;
}
