var ACCOUNT_NAMES = [
	"INAMI","FONART","SEP","EnTuCine","Weber","CALZADO ANDREA","UTEL","Ingenes","Viajamex","YS Media - Banamex",
	"CEMAC","ISDI - México","Casas Ara - Abaco","DOOPLA","Amex CM","Amex GCP"];
var ACCOUNT_TO_EMAILS = {
	"INAMI":["mariana@abacometrics.com","pamela@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"FONART":["mariana@abacometrics.com","pamela@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"SEP":["mariana@abacometrics.com","pamela@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"EnTuCine":["mariana@abacometrics.com","pamela@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"Weber":["mariana@abacometrics.com","pamela@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"CALZADO ANDREA":["daniel@abacometrics.com","omar@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"UTEL":["andrea@abacodigital.com","karina@abacodigital.com","eric@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"Ingenes":["christian@abacodigital.com","karina@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"Viajamex":["christian@abacodigital.com","daniela@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"YS Media - Banamex":["christian@abacodigital.com","karina@abacodigital.com","eric@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"CEMAC":["christian@abacodigital.com","carla@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"ISDI - México":["omar@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"Casas Ara - Abaco":["christian@abacodigital.com","daniela@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"DOOPLA":["carla@abacodigital.com","andrea@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"Amex CM":["carla@abacodigital.com","andrea@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"],
	"Amex GCP":["carla@abacodigital.com","andrea@abacodigital.com","salvador@abacodigital.com","luis.bosquez@abacometrics.com"]
}
var BAD_CODES = [404, 500];
var BROKEN_TAG_TEXT = "ERROR 500";

function main()
{
	var mccAccount = AdWordsApp.currentAccount();
  
	for(var i = 0; i<ACCOUNT_NAMES.length; i++)
	{ 
		var accounts = MccApp.accounts()
	    .withCondition("Name STARTS_WITH '" + ACCOUNT_NAMES[i] + "'")
        .withCondition('Impressions > 1')
        .forDateRange("LAST_WEEK")
    	.get();
	    while(accounts.hasNext())
    	{
			var account = accounts.next();
            Logger.log("ACCOUNT: " + account.getName());
			MccApp.select(account);
			var adsWithBrokenLinks = pauseAdsWithBrokenLinks();
            if(adsWithBrokenLinks.length > 0)
			{
				if(MailApp.getRemainingDailyQuota() > 1)
                {
            		sendEmailNotification(account, adsWithBrokenLinks, ACCOUNT_TO_EMAILS[ACCOUNT_NAMES[i]]);
                }
                else
                {
                	logAds(adsWithBrokenLinks);
                }
			}
    	}
	}
    MccApp.select(mccAccount);
}

function logAds(data)
{
  var log_text = "";
	for(var j = 0; j<data.length; j++) 
	{
          log_text += "id: " + data[j].id 
				+ "\t" + "campaignName: " + data[j].campaignName 
				+ "\t" + "adGroupName: " + data[j].adGroupName 
				+ "\t" + "headline: " + data[j].headline 
				+ "\t" + "description1: " + data[j].description1 
				+ "\t" + "description2: " + data[j].description2 
				+ "\t" + "url: " + data[j].url 
				+ "\t" + "response_code: " + data[j].response_code 
				+ "\t" + "time: " + _getFullDateString()
                + "\n";
	 }
  Logger.log(log_text);
}

function pauseAdsWithBrokenLinks() 
{
	var INCLUDE_PARAMS = false;
	var HTTP_OPTIONS = {
		muteHttpExceptions:true
	};
	
	
	var visitedLinks = {};
	var brokenLinkAds = [];
	
	var ads = AdWordsApp.ads()
		.withCondition("Status = 'ENABLED'")
		.withCondition("AdGroupStatus = 'ENABLED'")
		.withCondition("CampaignStatus = 'ENABLED'")
		.get();
	Logger.log(ads.totalNumEntities());
    var requestCount = 0;
	while(ads.hasNext())
	{

		var ad = ads.next();
		var url = ad.getDestinationUrl();
		if(url == null || url.length < 1)
		{
			continue;
		}
		if(url.indexOf('{') >= 0) 
		{
        	url = url.replace(/\{[0-9a-zA-Z]+\}/g,'');
      	}
		if(url.indexOf('?') >= 0 && INCLUDE_PARAMS)
		{
			url = url.replace(/\?(.*)$/i,'');
		}
		var response_code = -1;
		if(!visitedLinks[url])
		{
			try
			{
				response_code = UrlFetchApp.fetch(url, HTTP_OPTIONS).getResponseCode();
                requestCount++;
			} 
			catch(e)
			{
				//brokenLinkAds.push({"ad": ad, "code":response_code});
                Logger.log("Error: " + e.message + " ad:" + ad.getId() + " headline:"  + ad.getHeadline() + " url:" + ad.getDestinationUrl());
			}
			if(BAD_CODES.indexOf(response_code) >= 0)
			{
				brokenLinkAds.push({"ad": ad, "code":response_code});
				ad.applyLabel(BROKEN_TAG_TEXT);
				ad.pause();
                Logger.log("Error: " + response_code + " ad:" + ad.getId() + " headline:"  + ad.getHeadline() + " url:" + ad.getDestinationUrl());
			}
			visitedLinks[url] = response_code;
		}
		else
		{
			if(BAD_CODES.indexOf(visitedLinks[url]) >= 0)
			{
                brokenLinkAds.push({"ad": ad, "code":visitedLinks[url]});
				ad.applyLabel(BROKEN_TAG_TEXT);
				ad.pause();
			}

		}
		if(requestCount > 50)
        {
          Utilities.sleep(2000);
          requestCount = 0;
          Logger.log("Waiting...");
        }
	}
	
	var response = [];
	for(var i = 0; i<brokenLinkAds.length; i++)
	{
		response.push({
			id: brokenLinkAds[i].ad.getId(), 
			campaignName: brokenLinkAds[i].ad.getCampaign().getName(), 
			adGroupName: brokenLinkAds[i].ad.getAdGroup().getName(),
			headline: brokenLinkAds[i].ad.getHeadline(),
			description1: brokenLinkAds[i].ad.getDescription1(),
			description2: brokenLinkAds[i].ad.getDescription2(),
			url: brokenLinkAds[i].ad.getDestinationUrl(),
			response_code: brokenLinkAds[i].code
		});
	}
	
	return response;
}

function sendEmailNotification(account, data, emailAddresses)
{
	var SUBJECT = account.getName() + ": Anuncio de Adwords detenido por URL roto. " + _getDateString();
    var recipients = "";
	var EMAIL_BODY = "Hola, \nLos siguientes anuncios fueron detenidos porque se detectó que apuntan a URLs rotos. También fueron etiquetados como: '" + BROKEN_TAG_TEXT + "'\n";
	for(var i = 0; i<emailAddresses.length; i++)
	{
		for(var j = 0; j<data.length; j++) 
		{
			EMAIL_BODY += "id: " + data[j].id 
				+ "\t" + "campaignName: " + data[j].campaignName 
				+ "\t" + "adGroupName: " + data[j].adGroupName 
				+ "\t" + "headline: " + data[j].headline 
				+ "\t" + "description1: " + data[j].description1 
				+ "\t" + "description2: " + data[j].description2 
				+ "\t" + "url: " + data[j].url 
				+ "\t" + "response_code: " + data[j].response_code 
				+ "\t" + "time: " + _getFullDateString()
                + "\n";
	    }
    	recipients += emailAddresses[i];
        if(emailAddresses.length > 1 && i < (emailAddresses.length - 1))
        {
           recipients += ",";
        }
	}
    EMAIL_BODY += "\nSaludos.";
    EMAIL_BODY += "\n-Robot de Adwords de Ábaco";
    MailApp.sendEmail(recipients, SUBJECT, EMAIL_BODY);
}

function _getDateString() {
  return Utilities.formatDate((new Date()), AdWordsApp.currentAccount().getTimeZone(), "yyyy-MM-dd");
}

function _getFullDateString() {
  return Utilities.formatDate((new Date()), AdWordsApp.currentAccount().getTimeZone(), "yyyy-MM-dd HH:MM:SS");
}
