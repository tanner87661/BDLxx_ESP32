var mainScrollBox;
var bdTable;

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

function loadBDLTable(thisTable, thisData)
{
	var th = document.getElementById(thisTable.id + "_head");
	var tb = document.getElementById(thisTable.id + "_body");
	var numCols = th.childNodes[0].children.length;

	createDataTableLines(thisTable, [tfPos,tfManipulatorBox, tfNumericLong,tfNumericLong, tfText], thisData.length, "setBDLData(this)");	

	for (var i=0; i<thisData.length;i++)
	{
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "2");
		e.childNodes[0].value = thisData[i].InpRepNr;
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "3");
		e.childNodes[0].value = thisData[i].Distance;
		var e = document.getElementById(thisTable.id + "_" + i.toString() + "_" + "4");
		e.childNodes[0].innerHTML = "";
	}
}

function setCurrentDistance(newDistance)
{
	writeTextField("currdistance", newDistance);
	for (var i=0; i<configWorkData.BDTriggers.length;i++)
	{
		var e = document.getElementById(bdTable.id + "_" + i.toString() + "_" + "4");
		if (newDistance < configWorkData.BDTriggers[i].Distance)
		{
			writeTextField(e.id, "occupied");
			e.style.backgroundColor = "hsl(0, 50%, 50%)";
		}
		else
		{
			writeTextField(e.id, "free");
			e.style.backgroundColor = "hsl(120, 50%, 50%)";
		}
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

		bdTable = createDataTable(mainScrollBox, "tile-1_2", ["Pos","Add/Delete/Move Block Detector", "Block Detector #", "Trigger Distance [mm]", "Current Input Status"], "bdlconfig", "");

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
}

function processLocoNetInput(jsonData)
{
	setCurrentDistance(jsonData[0]);
}
