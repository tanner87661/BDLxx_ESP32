var mainScrollBox;
var rfidTable;

//CMD_RDR_ERASE=1, CMD_RDR_PING=2, CMD_RDR_ACK=3, 

var CMD_TAG_READ = 4;
// CMD_TAG_MAP=5, CMD_TAG_REQ=6};

var newTagTemplate = {"TagID":0,"DCCAddr": 0};

function setRFIDData(sender)
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
					configWorkData.TagMap.splice(thisRow+1, 0, JSON.parse(JSON.stringify(newTagTemplate)));
					break;
				case 2:
					configWorkData.TagMap.splice(thisRow, 1);
					break;
				case 3:
					if (thisRow > 0)
					{
						thisElement = configWorkData.TagMap.splice(thisRow, 1);
						configWorkData.TagMap.splice(thisRow-1,0, thisElement[0]);
			}
					break;
				case 4:
					if (thisRow < configWorkData.TagMap.length)
					{
						thisElement = configWorkData.TagMap.splice(thisRow, 1);
						configWorkData.TagMap.splice(thisRow+1,0, thisElement[0]);
					}
					break;
			}
			break;
		case 2: configWorkData.TagMap[thisRow].TagID = verifyNumber(sender.value, configWorkData.TagMap[thisRow].TagID); break;
		case 3: configWorkData.TagMap[thisRow].DCCAddr = verifyNumber(sender.value, configWorkData.TagMap[thisRow].DCCAddr); break;
	}
	loadRFIDTable(bdTable, configWorkData.TagMap);
}

function loadRFIDTable(thisTable, thisData)
{
	var th = document.getElementById(thisTable.id + "_head");
	var tb = document.getElementById(thisTable.id + "_body");
	var numCols = th.childNodes[0].children.length;

	createDataTableLines(thisTable, [tfPos,tfManipulatorBox, tfNumericLong,tfNumericLong], thisData.length, "setRFIDData(this)");	

	for (var i=0; i<thisData.length;i++)
	{
		console.log(typeof(thisData[i].TagID));
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "2");
		e.childNodes[0].value = thisData[i].TagID;
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "3");
		e.childNodes[0].value = thisData[i].DCCAddr;
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
		createPageTitle(mainScrollBox, "div", "tile-1", "", "h1", "Tag to DCC Map Setup");
		createPageTitle(mainScrollBox, "div", "tile-1", "", "h2", "Hardware Settings (read only)");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createDispText(tempObj, "tile-1_4", "SDA Pin", "n/a", "sdapin");
			createDispText(tempObj, "tile-1_4", "SCK Pin", "n/a", "sclpin");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createDispText(tempObj, "tile-1_4", "MISO Pin", "n/a", "misopin");
			createDispText(tempObj, "tile-1_4", "MOSI Pin", "n/a", "mosipin");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createDispText(tempObj, "tile-1_4", "Restart Pin", "n/a", "rstpin");

		createPageTitle(mainScrollBox, "div", "tile-1", "", "h2", "Tag to DCC Map");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createDispText(tempObj, "tile-1_2", "Tag ID on Reader:", "n/a", "currtag");

		bdTable = createDataTable(mainScrollBox, "tile-1_2", ["Pos","Add/Delete/Move Tag", "RFID Tag #", "Assigned DCC Address"], "rfidconfig", "");

		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createEmptyDiv(tempObj, "div", "tile-1_4", "");
			createButton(tempObj, "tile-1_4", "Save & Restart", "btnSave", "saveSettings(this)");
			createButton(tempObj, "tile-1_4", "Cancel", "btnCancel", "cancelSettings(this)");
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
					for (var i = 0; i < 4; i++)
					{
						var thisNibble = Number(jsonData[i+10]);
						thisNibble += (jsonData[9] & (0x08 >> (3-i)))? 0x80:0x00;
						console.log(thisNibble.toString(16));
						tagID += Number((thisNibble << (24-(8 * i))));
					}
					writeTextField("currtag", (tagID & 0xFFFFFFFF).toString());
					console.log("RFID Data ", (tagID & 0xFFFFFFFF).toString(16));
				}
			break;
		default:
			break;
	}
}

function loadNodeDataFields(jsonData)
{
	writeTextField("sdapin", jsonData.RFIDConfig.rfidSDA_SS);
	writeTextField("sclpin", jsonData.RFIDConfig.rfidSCK);
	writeTextField("misopin", jsonData.RFIDConfig.rfidMISO);
	writeTextField("mosipin", jsonData.RFIDConfig.rfidMOSI);
	writeTextField("rstpin", jsonData.RFIDConfig.rfidRST);
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
	loadRFIDTable(bdTable, jsonData.TagMap);
}

function processLocoNetInput(jsonData)
{
	setRFIDReaderData(jsonData);
}
