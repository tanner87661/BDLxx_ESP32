var mainScrollBox;
var bdTable;

var tagList = [];
var dccAddrList = [];

//CMD_RDR_ERASE=1, CMD_RDR_PING=2, CMD_RDR_ACK=3, 

var CMD_TAG_READ = 4;
// CMD_TAG_MAP=5, CMD_TAG_REQ=6};

var newBDLTemplate = {"InpRepNr":0,"Distance": 0};

function setBDLData(sender)
{
	var thisRow = parseInt(sender.getAttribute("row"));
	var thisCol = parseInt(sender.getAttribute("col"));
	var thisIndex = parseInt(sender.getAttribute("index"));
	console.log(thisRow, thisCol, thisIndex);
	var thisElement;
	switch (thisCol)
	{
		case 1:
			switch(thisIndex)
			{
				case 1:
					configWorkData.BDTriggers.splice(thisRow+1, 0, JSON.parse(JSON.stringify(newBDLTemplate)));
					break;
				case 2:
					configWorkData.BDTriggers.splice(thisRow, 1);
					break;
				case 3:
					if (thisRow > 0)
					{
						thisElement = configWorkData.BDTriggers.splice(thisRow, 1);
						configWorkData.BDTriggers.splice(thisRow-1,0, thisElement[0]);
			}
					break;
				case 4:
					if (thisRow < configWorkData.BDTriggers.length)
					{
						thisElement = configWorkData.BDTriggers.splice(thisRow, 1);
						configWorkData.BDTriggers.splice(thisRow+1,0, thisElement[0]);
					}
					break;
			}
			break;
		case 2: configWorkData.BDTriggers[thisRow].InpRepNr = verifyNumber(sender.value, configWorkData.BDTriggers[thisRow].InpRepNr); break;
		case 3: configWorkData.BDTriggers[thisRow].Distance = verifyNumber(sender.value, configWorkData.BDTriggers[thisRow].Distance); break;
	}
	loadBDLTable(bdTable, configWorkData.BDTriggers);
}

function setUseAnalog(sender)
{
	if (sender.id == "cbSendAnalog")
		configWorkData.sendAnalog = sender.checked;
	if (sender.id == "analogaddr")
		configWorkData.analogAddr = verifyNumber(sender.value, configWorkData.analogAddr);
	if (sender.id == "maxdistance")
		configWorkData.maxDistance = verifyNumber(sender.value, configWorkData.maxDistance);
	if (sender.id == "txthreshold")
		configWorkData.txThreshold = verifyNumber(sender.value, configWorkData.txThreshold);
}

function loadReaderData(thisData)
{
	writeCBInputField("cbSendAnalog", thisData.sendAnalog);
	writeInputField("analogaddr", thisData.analogAddr);
	writeInputField("maxdistance", thisData.maxDistance);
	writeInputField("txthreshold", thisData.txThreshold);
}

function loadBDLTable(thisTable, thisData)
{
	var th = document.getElementById(thisTable.id + "_head");
	var tb = document.getElementById(thisTable.id + "_body");
	var numCols = th.childNodes[0].children.length;

	createDataTableLines(thisTable, [tfPos,tfManipulatorBox, tfNumericLong,tfNumericLong, tfText, tfText, tfText], thisData.length, "setBDLData(this)");	

	for (var i=0; i<thisData.length;i++)
	{
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "2");
		e.childNodes[0].value = thisData[i].InpRepNr;
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "3");
		e.childNodes[0].value = thisData[i].Distance;
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "4");
		e.childNodes[0].innerHTML = "";
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "5");
		e.childNodes[0].innerHTML = "";
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "6");
		e.childNodes[0].innerHTML = "";
	}
}

function setCurrentDistance(newDistance)
{
	if (configWorkData.BDTriggers != undefined)
	{
		writeTextField("currdistance", newDistance);
		var clearTags = true;
		for (var i=0; i<configWorkData.BDTriggers.length;i++)
		{
			var status = document.getElementById(bdTable.id + "_" + i.toString() + "_" + "4");
			var tag = document.getElementById(bdTable.id + "_" + i.toString() + "_" + "5");
			var loco = document.getElementById(bdTable.id + "_" + i.toString() + "_" + "6");
			if (newDistance < configWorkData.BDTriggers[i].Distance)
			{
				writeTextField(status.id, "occupied");
				status.style.backgroundColor = "hsl(0, 50%, 50%)";
				writeTextField(tag.id, tagList);
				writeTextField(loco.id, dccAddrList);
				clearTags = false;
			}
			else
			{
				writeTextField(status.id, "free");
				status.style.backgroundColor = "hsl(120, 50%, 50%)";
				writeTextField(tag.id, "");
				writeTextField(loco.id, "");
			}
		}
		if (clearTags)
		{
			tagList = [];
			dccAddrList = [];
		}
	}
}

function setRFIDReaderData(jsonData)
{
	switch (jsonData[0])
	{
		case 0xE5: //RFID
			if ((jsonData[1] == 0x14) && (jsonData[2] == 0x06) &&(jsonData[3] == 0x20)) //RFID Reader command
				if ((jsonData[16] == nodeConfigData.RFIDConfig.readerID) && (jsonData[15] == CMD_TAG_READ))
				{
					var tagID = Number(0x100000000); //this is a trick to prevent negative number interpretation. no idea why this works
//					for (var i = 0; i < 4; i++)
//					{
//						var thisNibble = jsonData[i+5];
//						thisNibble |= (jsonData[4] & (0x08 >> i))? 0x80:0x00;
//						console.log(thisNibble);
//						tagID += thisNibble << (8 * i);
//					}
					for (var i = 0; i < 4; i++)
					{
						var thisNibble = Number(jsonData[i+10]);
						thisNibble += (jsonData[9] & (0x08 >> (3-i)))? 0x80:0x00;
						console.log(thisNibble.toString(16));
						tagID += Number((thisNibble << (24-(8 * i))));
					}
					console.log("RFID Data ", (tagID & 0xFFFFFFFF).toString(16));
					if (tagList.indexOf(tagID & 0xFFFFFFFF) < 0)
						tagList.push((tagID & 0xFFFFFFFF));
				}
			break;
		case 0xD0: //MULTI_SENSE
			if (jsonData[2] == nodeConfigData.RFIDConfig.readerID)
			{
				var dccAddr = (jsonData[3] << 7) + jsonData[4];
				console.log("Multi Sense Data ", dccAddr);
				if (dccAddrList.indexOf(dccAddr) < 0)
					dccAddrList.push(dccAddr);
			}
			break;
		default:
			break;
	}
}

function constructFooterContent(footerTab)
{
	var tempObj;
	tempObj = createEmptyDiv(footerTab, "div", "tile-1_4", "footerstatsdiv1");
		createDispText(tempObj, "", "Date / Time", "n/a", "sysdatetime");
		createDispText(tempObj, "", "System Uptime", "n/a", "uptime");
	tempObj = createEmptyDiv(footerTab, "div", "tile-1_4", "footerstatsdiv2");
		createDispText(tempObj, "", "IP Address", "n/a", "IPID");
		createDispText(tempObj, "", "Signal Strength", "n/a", "SigStrengthID");
	tempObj = createEmptyDiv(footerTab, "div", "tile-1_4", "footerstatsdiv3");
		createDispText(tempObj, "", "Firmware Version", "n/a", "firmware");
		createDispText(tempObj, "", "Available Memory", "n/a", "heapavail");
}

function constructPageContent(contentTab)
{
	var tempObj;
	mainScrollBox = createEmptyDiv(contentTab, "div", "pagetopicboxscroll-y", "btnconfigdiv");
		createPageTitle(mainScrollBox, "div", "tile-1", "", "h1", "Block Detector Setup");
		createPageTitle(mainScrollBox, "div", "tile-1", "", "h2", "Basic Settings");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createDispText(tempObj, "tile-1_4", "SDA Pin", "n/a", "sdapin");
			createDispText(tempObj, "tile-1_4", "SCL Pin", "n/a", "sclpin");

		createPageTitle(mainScrollBox, "div", "tile-1", "", "h2", "Block Detector Configuration");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createDispText(tempObj, "tile-1_2", "Current Distance [mm]:", "n/a", "currdistance");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createCheckbox(tempObj, "tile-1_4", "Send as Analog value", "cbSendAnalog", "setUseAnalog(this)");
			createTextInput(tempObj, "tile-1_4", "to Analog Address", "n/a", "analogaddr", "setUseAnalog(this)");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createTextInput(tempObj, "tile-1_4", "Maximum Distance", "n/a", "maxdistance", "setUseAnalog(this)");
			createTextInput(tempObj, "tile-1_4", "Transmit Threshold", "n/a", "txthreshold", "setUseAnalog(this)");

		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
		bdTable = createDataTable(tempObj, "tile-1_2", ["Pos","Add/Delete/Move Block Detector", "Block Detector #", "Trigger Distance [mm]", "Current Input Status", "Tags", "Locos"], "bdlconfig", "");

		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createEmptyDiv(tempObj, "div", "tile-1_4", "");
			createButton(tempObj, "tile-1_4", "Save & Restart", "btnSave", "saveSettings(this)");
			createButton(tempObj, "tile-1_4", "Cancel", "btnCancel", "cancelSettings(this)");
}

function loadNodeDataFields(jsonData)
{
	writeTextField("sdapin", jsonData.LidarConfig.lidarSDA);
	writeTextField("sclpin", jsonData.LidarConfig.lidarSCL);
}

function processStatsData(jsonData)
{
	writeTextField("sysdatetime", jsonData.systime);
	writeTextField("uptime", formatTime(Math.trunc(jsonData.uptime/1000)));
	writeTextField("IPID", jsonData.ipaddress);
	writeTextField("SigStrengthID", jsonData.sigstrength + " dBm");
	writeTextField("firmware", jsonData.version);
	writeTextField("heapavail", jsonData.freemem + " Bytes");
}

function loadDataFields(jsonData)
{
	loadBDLTable(bdTable, jsonData.BDTriggers);
	loadReaderData(jsonData);
}

function processDistanceInput(jsonData)
{
	setCurrentDistance(jsonData[0]);
}

function processLocoNetInput(jsonData)
{
	setRFIDReaderData(jsonData);
}
