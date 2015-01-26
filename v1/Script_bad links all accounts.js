var BAD_CODES = [404, 500];
var BROKEN_TAG_TEXT = "ERROR 500";
var NOTIFIED_EMAIL_ADDRESSES = ["luis.bosquez@abacometrics.com"];

function main() 
{
	var account = AdWordsApp.currentAccount();
	var mccAccount = AdWordsApp.currentAccount();

	var accounts = MccApp.accounts()
	.withCondition("Impressions > 100")
	.forDateRange("LAST_MONTH")
	.orderBy("Clicks DESC")
	.get();
	
	
	while(accounts.hasNext())
	{
		var adsWithBrokenLinks = pauseAdsWithBrokenLinks();
	    MccApp.select(account);
		if(adsWithBrokenLinks.length > 0)
		{A
			sendEmailNotification(account, adsWithBrokenLinks, NOTIFIED_EMAIL_ADDRESSES);
		}
	}
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
		.withCondition("Type = 'TEXT_AD'")
		.get();
	Logger.log(ads.totalNumEntities());
	
	while(ads.hasNext())
	{
		var ad = ads.next();
		if(ad.getDestinationUrl() == null)
		{
			continue;
		}
		var url = ad.getDestinationUrl();
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
			} 
			catch(e)
			{
				brokenLinkAds.push({"ad": ad, "code":response_code});
                Logger.log("Error");
			}
			if(BAD_CODES.indexOf(response_code) >= 0)
			{
				brokenLinkAds.push({"ad": ad, "code":response_code});
				ad.applyLabel(BROKEN_TAG_TEXT);
				ad.pause();
			}
			visitedLinks[url] = response_code;
            Logger.log("Visited: " + url);
            Logger.log("Response code = " + response_code);
		}
		else
		{
			if(BAD_CODES.indexOf(visitedLinks[url]) >= 0)
			{
                brokenLinkAds.push({"ad": ad, "code":visitedLinks[url]});
				ad.applyLabel(BROKEN_TAG_TEXT);
				ad.pause();
			}
            Logger.log("Visited: " + url);
            Logger.log("Response code = " + visitedLinks[url]);
		}
		
	}
	
	var response = [];
	for(var i = 0; i<brokenLinkAds.length; i++)
	{
		response.push({
			"id": brokenLinkAds[i]["ad"].getId(), 
			"campaignName": brokenLinkAds[i]["ad"].getCampaign().getName(), 
			"adGroupName": brokenLinkAds[i]["ad"].getAdGroup().getName(),
			"headline": brokenLinkAds[i]["ad"].getHeadline(),
			"description1": brokenLinkAds[i]["ad"].getDescription1(),
			"description2": brokenLinkAds[i]["ad"].getDescription2(),
			"url": brokenLinkAds[i]["ad"].getDestinationUrl()
		});
	}
	
	return response;
}

function sendEmailNotification(account, data, emailAddresses)
{
	var SUBJECT = account.getName() + ": Anuncio de Adwords detenido por URL roto. " + _getDateString();
	var EMAIL_BODY = "Hola, \nLos siguientes anuncios fueron detenidos porque se detectó que apuntan a URLs rotos. También fueron etiquetados como: '" + BROKEN_TAG_TEXT + "'\n";
	for(var i = 0; i<emailAddresses.length; i++)
	{
		for(var j = 0; j<data.length; j++) 
		{
			EMAIL_BODY += "id: " + data["id"] 
				+ "\t" + "campaignName: " + data["campaignName"] 
				+ "\t" + "adGroupName: " + data["adGroupName"] 
				+ "\t" + "headline: " + data["headline"] 
				+ "\t" + "description1: " + data["description1"] 
				+ "\t" + "description2: " + data["description2"] 
				+ "\t" + "url: " + data["url"] 
				+ "\t" + "time: " + _getFullDateString()
                + "\n";
	    }
        EMAIL_BODY += "\nSaludos.";
    	MailApp.sendEmail(emailAddresses[i], SUBJECT, EMAIL_BODY);
	}
}

function _getDateString() {
  return Utilities.formatDate((new Date()), AdWordsApp.currentAccount().getTimeZone(), "yyyy-MM-dd");
}

function _getFullDateString() {
  return Utilities.formatDate((new Date()), AdWordsApp.currentAccount().getTimeZone(), "yyyy-MM-dd HH:MM:SS");
}