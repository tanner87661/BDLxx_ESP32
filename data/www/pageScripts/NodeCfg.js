var mainScrollBox;
var topicStats1;
var topicStats2;
var topicWificb;
var topicNTPcb;
var configAPModuleBox;
var configNTPBox;
var configDHCPBox;
var configDHCPSection;
var configAPBox;
var moduleConfig;
var modLoxConfig;
var modHWBtnConfig;
var modLNConfig;
var modALMOnly;
var modAlwaysOn;
var modWifiOnly;
var modDecoderOnly;
var modWifiALMOnly;

//commMode: 0: DCC, 1: LocoNet, 2: MQTT, 3: Gateway
//workMode: 0: Decoder, 1: ALM

function setDisplayOptions()
{
//	writeCBInputField("cbUseDCC", configWorkData.commMode == 0);
//	configWorkData.useDCC = configWorkData.commMode == 0 ? 1:0;
	writeCBInputField("cbUseLN", ((configWorkData.commMode == 1) || (configWorkData.commMode == 3)));
	configWorkData.useLocoNetModule = ((configWorkData.commMode == 1) || (configWorkData.commMode == 3)) ? 1:0;
	writeCBInputField("cbUseMQTT", ((configWorkData.commMode == 2) || (configWorkData.commMode == 3)));
	configWorkData.useMQTT = ((configWorkData.commMode == 2) || (configWorkData.commMode == 3)) ? 1:0;
//	writeCBInputField("cbUseGW", configWorkData.commMode == 3);
//	configWorkData.useGateway = configWorkData.commMode == 3 ? 1:0;

	setVisibility((configWorkData.wifiMode & 0x02) > 0, configAPModuleBox);
	setVisibility((configWorkData.wifiMode & 0x02) > 0, configAPBox);
	setVisibility(configWorkData.useNTP, configNTPBox);
	setVisibility((configWorkData.wifiMode & 0x01) > 0, configDHCPSection);
	setVisibility(configWorkData.useStaticIP, configDHCPBox);
//	setVisibility(configWorkData.useDCC, modLoxConfig);
	setVisibility(configWorkData.useLocoNetModule, modLNConfig);
//	setVisibility(configWorkData.useButtonModule, modHWBtnConfig);
//	setVisibility(configWorkData.workMode==0, modDecoderOnly);
//	setVisibility(configWorkData.workMode==1, modALMOnly);
	setVisibility(configWorkData.useWifiTimeout==0, modWifiOnly);
//	setVisibility((configWorkData.useWifiTimeout==0) && (configWorkData.useWifiTimeout==0), modWifiALMOnly);
//	enableInput(false, "cbUseDCC");
//	enableInput(false, "cbUseGW");
	enableInput(false, "cbUseMQTT");
	enableInput(false, "cbUseLN");
}

function loadCommOptions()
{
	var optionStr = [];
	if (configWorkData.workMode==0)
		optionStr.push("DCC");
	else
		optionStr.push("");
	optionStr.push("LocoNet");
	if (configWorkData.useWifiTimeout==0)
		optionStr.push("MQTT");
	else
		optionStr.push("");
//	if ((configWorkData.useWifiTimeout==0) && (configWorkData.workMode==1))
//		optionStr.push("Gateway");
//	else
		optionStr.push("");
	createOptions(document.getElementById("selectcommmode"), optionStr);
	setDropdownValue("selectcommmode", configWorkData.commMode);
	configWorkData.commMode = getDropdownValue("selectcommmode");
	if (configWorkData.commMode < 0)
	{
		configWorkData.commMode = 1;
		setDropdownValue("selectcommmode", configWorkData.commMode);
	}

//	console.log(configWorkData.commMode);
}

function setCommMode(sender)
{
	configWorkData.commMode = verifyNumber(sender.options[sender.selectedIndex].value, configWorkData.commMode);
	setDisplayOptions();
//  console.log(configWorkData.commMode);
	
}

function setWifiStatus(sender)
{
	configWorkData.useWifiTimeout = sender.checked ? 1:0;
	loadCommOptions();
	setDisplayOptions();
}

function setNTPStatus(sender)
{
	configWorkData.useNTP = sender.checked ? 1:0;
	setDisplayOptions();
}

function setNTPServer(sender)
{
	configWorkData.ntpConfig.NTPServer = sender.value;
}

function setNTPTimeZone(sender)
{
//	configWorkData.ntpConfig.ntpTimeZone = verifyNumber(sender.value, configWorkData.ntpConfig.ntpTimeZone);
	configWorkData.ntpConfig.ntpTimeZone = sender.value;
}

function setNodeName(sender)
{
	configWorkData.devName = sender.value;
}

function setUseMac(sender)
{
	configWorkData.inclMAC = sender.checked ? 1:0;
}

function setUseDHCP(sender)
{
	configWorkData.useStaticIP = sender.checked ? 1:0;
	setDisplayOptions();
}

function setDHCP(sender)
{
	if (sender.id == "staticip")
		configWorkData.staticConfig.staticIP = sender.value;
	if (sender.id == "gatewayip")
		configWorkData.staticConfig.staticGateway = sender.value;
	if (sender.id == "netmask")
		configWorkData.staticConfig.staticNetmask = sender.value;
	if (sender.id == "dnsserver")
		configWorkData.staticConfig.staticDNS = sender.value;
	console.log(configWorkData.staticConfig);
}

/*
function setUseAP(sender)
{
	if (sender.checked)
		configWorkData.wifiMode |= 0x02;
	else
		configWorkData.wifiMode &= !0x02;
	setDisplayOptions();
}
*/
function setAP(sender)
{
	if (sender.id == "ap_ip")
		configWorkData.apConfig.apGateway = sender.value;
	if (sender.id == "ap_password")
		configWorkData.apConfig.apPassword = sender.value;
	console.log(configWorkData.apConfig);
}

function setWorkMode(sender, id)
{
	configWorkData.workMode = (sender.id == "selectworkmode_0") ? 0 : 1;
	loadCommOptions();
	setDisplayOptions();
}

function setWifiMode(sender, id)
{
	if (sender.id == "selectwifimode_0")
		configWorkData.wifiMode = 1;
	if (sender.id == "selectwifimode_1")
		configWorkData.wifiMode = 2;
	if (sender.id == "selectwifimode_2")
		configWorkData.wifiMode = 3;
	setDisplayOptions();
}

function setUseDCC(sender)
{
	configWorkData.useDCC = sender.checked ? 1:0;
	setDisplayOptions();
}

function setDCC(sender)
{
	if (sender.id == "dcc_rx")
		configWorkData.DccConfig.DccInPin = verifyNumber(sender.value, configWorkData.DccConfig.DccInPin);
	if (sender.id == "dcc_ack")
		configWorkData.DccConfig.DccAckPin = verifyNumber(sender.value, configWorkData.DccConfig.DccAckPin);
	console.log(configWorkData.DccConfig);
}

function setUseLN(sender)
{
	configWorkData.useLocoNetModule = sender.checked ? 1:0;
	setDisplayOptions();
}

function setLN(sender)
{
	if (sender.id == "ln_rx")
		configWorkData.LnModConfig.pinRx = verifyNumber(sender.value, configWorkData.LnModConfig.pinRx);
	if (sender.id == "ln_tx")
		configWorkData.LnModConfig.pinTx = verifyNumber(sender.value, configWorkData.LnModConfig.pinTx);
	if (sender.id == "ln_reverse")
		configWorkData.LnModConfig.invLogic = sender.checked ? 1:0;
	if (sender.id == "ln_busy")
		configWorkData.LnModConfig.busyLEDPin = verifyNumber(sender.value, configWorkData.LnModConfig.busyLEDPin);
	console.log(configWorkData.LnModConfig);
}

function setUseHWBtn(sender)
{
	configWorkData.useButtonModule = sender.checked ? 1:0;
	setDisplayOptions();
}

function setHWBtn(sender)
{
	var retVal;
	if (sender.id == "btnaddr")
	{
		retVal = readTextInputToArray("btnaddr", 4, 4)
		if (retVal != -1)
			configWorkData.BtnModConfig.AddrPins = retVal;
	}
	if (sender.id == "btndata")
	{
		retVal = readTextInputToArray("btndata", 1, 4)
		if (retVal != -1)
			configWorkData.BtnModConfig.DataPins = retVal;
	}
	console.log(configWorkData.BtnModConfig);
}

function setUseBtnHdlr(sender)
{
	configWorkData.useButtonHandler = sender.checked ? 1:0;
}

function setUseGateway(sender)
{
	configWorkData.useGateway = sender.checked ? 1:0;
}

function setUseMQTT(sender)
{
	configWorkData.useMQTT = sender.checked ? 1:0;
}

function setUseLEDChain(sender)
{
	configWorkData.useLEDModule = sender.checked ? 1:0;
}

function setUseBushbyBit(sender)
{
	configWorkData.useBushby = sender.checked ? 1:0;
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
	mainScrollBox = createEmptyDiv(contentTab, "div", "pagetopicboxscroll-y", "nodeconfigdiv");
		createPageTitle(mainScrollBox, "div", "tile-1", "", "h2", "Wifi Setup");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createTextInput(tempObj, "tile-1_4", "Node Name", "n/a", "nodename", "setNodeName(this)");
			createCheckbox(tempObj, "tile-1_4", "Add MAC Address", "cbUseMac", "setUseMac(this)");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createRadiobox(tempObj, "tile-1_2", "", ["Connect to WiFi", "Device Access Point", "Wifi and Device AP"], "selectwifimode", "setWifiMode(this, id)");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "wificb");
			createCheckbox(tempObj, "tile-1_4", "Disable Wifi when not used", "cbUseWifi", "setWifiStatus(this)");

		configDHCPSection = createEmptyDiv(mainScrollBox, "div", "", "");
		createPageTitle(configDHCPSection, "div", "tile-1", "", "h3", "DHCP Configuration");
		tempObj = createEmptyDiv(configDHCPSection, "div", "tile-1", "");
			createCheckbox(tempObj, "tile-1_4", "Use Static IP", "cbDHCP", "setUseDHCP(this)");
		configDHCPBox = createEmptyDiv(configDHCPSection, "div", "", "");
			configDHCPBox.style.display = "none";
			tempObj = createEmptyDiv(configDHCPBox, "div", "tile-1", "");
				createTextInput(tempObj, "tile-1_4", "Static IP", "n/a", "staticip", "setDHCP(this)");
				createTextInput(tempObj, "tile-1_4", "Gateway IP", "n/a", "gatewayip", "setDHCP(this)");
			tempObj = createEmptyDiv(configDHCPBox, "div", "tile-1", "");
				createTextInput(tempObj, "tile-1_4", "Netmask", "n/a", "netmask", "setDHCP(this)");
				createTextInput(tempObj, "tile-1_4", "DNS Server", "n/a", "dnsserver", "setDHCP(this)");
		configAPModuleBox = createEmptyDiv(mainScrollBox, "div", "", "");
			createPageTitle(configAPModuleBox, "div", "tile-1", "", "h3", "Access Point Configuration");
//			tempObj = createEmptyDiv(configAPModuleBox, "div", "tile-1", "");
//				createCheckbox(tempObj, "tile-1_4", "Provide Access Point", "cbUseAP", "setUseAP(this)");
			configAPBox = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
				configAPBox.style.display = "none";
				tempObj = createEmptyDiv(configAPBox, "div", "tile-1", "");
					createTextInput(tempObj, "tile-1_4", "Access Point IP", "n/a", "ap_ip", "setAP(this)");
					createTextInput(tempObj, "tile-1_4", "Access Point Password", "n/a", "ap_password", "setAP(this)");
		createEmptyDiv(mainScrollBox, "div", "tile-1", "ntplinebox");
		createPageTitle(mainScrollBox, "div", "tile-1", "", "h3", "Network Time Setup");
		topicNTPcb = createEmptyDiv(mainScrollBox, "div", "pagetopicbox", "ntpcb");
			createCheckbox(topicNTPcb, "tile-1_4", "Use Internet Time", "cbUseNTP", "setNTPStatus(this)");
			configNTPBox = createEmptyDiv(mainScrollBox, "div", "tile-1", "ntpcontrolbox");
				configNTPBox.style.display = "none";
				createTextInput(configNTPBox, "tile-1_4", "NTP Server", "n/a", "ntpserverurl", "setNTPServer(this)");
				createTextInput(configNTPBox, "tile-1_4", "Timezone", "0", "ntptimezone", "setNTPTimeZone(this)");


		createPageTitle(mainScrollBox, "div", "tile-1", "", "h2", "Module Work Mode");
		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createDropdownselector(tempObj, "tile-1_4", "Command Source", ["DCC", "LocoNet", "MQTT", "Gateway"], "selectcommmode", "setCommMode(this, id)");

		moduleConfig = createPageTitle(mainScrollBox, "div", "tile-1", "", "h2", "Module Activation");
		modAlwaysOn = createEmptyDiv(mainScrollBox, "div", "tile-1", "alwaysoncontrolbox");
			tempObj = createEmptyDiv(modAlwaysOn, "div", "tile-1", "");
				createCheckbox(tempObj, "tile-1_4", "use LED Chain Module", "cbUseLEDChain", "setUseLEDChain(this)");
				
		modALMOnly = createEmptyDiv(mainScrollBox, "div", "tile-1", "wifionlycontrolbox");
		modDecoderOnly = createEmptyDiv(mainScrollBox, "div", "tile-1", "wifionlycontrolbox");

			modLoxConfig = createEmptyDiv(modDecoderOnly, "div", "tile-1", "");
				createTextInput(modLoxConfig, "tile-1_4", "SDA Pin", "n/a", "lox_sda", "setLOX(this)");
				createTextInput(modLoxConfig, "tile-1_4", "SCL Pin", "n/a", "lox_scl", "setLOX(this)");


		modWifiOnly = createEmptyDiv(mainScrollBox, "div", "tile-1", "wifionlycontrolbox");
			tempObj = createEmptyDiv(modWifiOnly, "div", "tile-1", "");
				createCheckbox(tempObj, "tile-1_4", "use MQTT Module", "cbUseMQTT", "setUseMQTT(this)");


		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			tempObj = createEmptyDiv(tempObj, "div", "tile-1", "");
				createCheckbox(tempObj, "tile-1_4", "use LocoNet Module", "cbUseLN", "setUseLN(this)");
			modLNConfig = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
				modLNConfig.style.display = "none";
				tempObj = createEmptyDiv(modLNConfig, "div", "tile-1", "");
					createTextInput(tempObj, "tile-1_4", "LN Rx Pin", "n/a", "ln_rx", "setLN(this)");
					createTextInput(tempObj, "tile-1_4", "LN Tx Pin", "n/a", "ln_tx", "setLN(this)");
				tempObj = createEmptyDiv(modLNConfig, "div", "tile-1", "");
					createTextInput(tempObj, "tile-1_4", "Busy LED Pin", "n/a", "ln_busy", "setLN(this)");
					createCheckbox(tempObj, "tile-1_4", "use Reverse Logic", "ln_reverse", "setLN(this)");

		tempObj = createEmptyDiv(mainScrollBox, "div", "tile-1", "");
			createEmptyDiv(tempObj, "div", "tile-1_4", "");
			createButton(tempObj, "tile-1_4", "Save & Restart", "btnSave", "saveSettings(this)");
			createButton(tempObj, "tile-1_4", "Cancel", "btnCancel", "cancelSettings(this)");

}

function loadNodeDataFields(jsonData)
{
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
	
	writeRBInputField("selectwifimode", jsonData.wifiMode-1);
	writeCBInputField("cbUseWifi", jsonData.useWifiTimeout);
	writeInputField("nodename", jsonData.devName);
	writeCBInputField("cbUseMac", jsonData.inclMAC);
	writeCBInputField("cbDHCP", jsonData.useStaticIP);
	setVisibility(jsonData.useStaticIP, configDHCPBox, true);
	writeInputField("staticip", jsonData.staticConfig.staticIP);
	writeInputField("gatewayip", jsonData.staticConfig.staticGateway);
	writeInputField("netmask", jsonData.staticConfig.staticNetmask);
	writeInputField("dnsserver", jsonData.staticConfig.staticDNS);
	
	writeInputField("ap_ip", jsonData.apConfig.apGateway);
	writeInputField("ap_password", jsonData.apConfig.apPassword);

	writeRBInputField("selectworkmode", jsonData.workMode);
	
//	setVisibility(jsonData.useDCC, modDCCConfig);
	writeInputField("lox_sda", jsonData.LidarConfig.lidarSDA);
	writeInputField("lox_scl", jsonData.LidarConfig.lidarSCL);

//	writeCBInputField("cbUseHWBtn", jsonData.useButtonModule);
//	setVisibility(jsonData.useButtonModule, modHWBtnConfig);
//	writeInputField("btnaddr", jsonData.BtnModConfig.AddrPins);
//	writeInputField("btndata", jsonData.BtnModConfig.DataPins);

//	writeCBInputField("cbUseBtnHdlr", jsonData.useButtonHandler);
	writeCBInputField("cbUseLEDChain", jsonData.useLEDModule);
	writeCBInputField("cbUseMQTT", jsonData.useMQTT);
//	writeCBInputField("cbUseGW", jsonData.useGateway);

	writeCBInputField("cbUseLN", jsonData.useLocoNetModule);
	setVisibility(jsonData.useLocoNetModule, modLNConfig);
	writeInputField("ln_rx", jsonData.LnModConfig.pinRx);
	writeInputField("ln_tx", jsonData.LnModConfig.pinTx);
	writeInputField("ln_busy", jsonData.LnModConfig.busyLEDPin);
	writeCBInputField("ln_reverse", jsonData.LnModConfig.invLogic);
	
	writeCBInputField("cbUseNTP", jsonData.useNTP);
	setVisibility(jsonData.useNTP, configNTPBox);
	writeInputField("ntpserverurl", jsonData.ntpConfig.NTPServer);
	writeInputField("ntptimezone", jsonData.ntpConfig.ntpTimeZone);
	loadCommOptions();
	setDisplayOptions();
}
