function main() 
{
	var NOTIFIED_EMAIL_ADDRESSES = ["luis.bosquez@abacometrics.com"];
	var mccAccount = AdWordsApp.currentAccount();

	var accounts = MccApp.accounts()
	.withCondition("Impressions > 100")
	.forDateRange("LAST_MONTH")
	.orderBy("Clicks DESC")
	.get();

	while(accounts.hasNext())
	{
		var account = accounts.next();
		MccApp.select(account);

		var adsWithBrokenLinks = pauseAdsWithBrokenLinks(account, NOTIFIED_EMAIL_ADDRESSES);
		if(adsWithBrokenLinks.length > 0)
		{
			sendEmailNotification(adsWithBrokenLinks);
		}
	}


}

function pauseAdsWithBrokenLinks(account) 
{
	var INCLUDE_PARAMS = false;
	var HTTP_OPTIONS = {
		muteHttpExceptions:true
	};
	var BAD_CODES = [404, 500];
	var BROKEN_TAG_TEXT = "Link Roto";
	
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
				//ad.applyLabel(BROKEN_TAG_TEXT);
				//ad.pause();
			}
			Logger.log("Visited: " + url);
            Logger.log("Response code = " + response_code);
			visitedLinks[url] = response_code;
		}
	}    
	var response = [];
	for(var i = 0; i<brokenLinkAds.length; i++)
	{
		response.push({
			"account": account.getName(),
			"id": brokenLinkAds[i]["ad"].getId(), 
			"campaignName": brokenLinkAds[i]["ad"].getCampaign().getName(), 
			"adGroupName": brokenLinkAds[i]["ad"].getAdGroup().getName(),
			"headline": brokenLinkAds[i]["ad"].getHeadline(),
			"description1": brokenLinkAds[i]["ad"].getDescription1(),
			"description2": brokenLinkAds[i]["ad"].getDescription2()
		});
	}
	
	return response;
}

function sendEmailNotification(data, emailAddresses)
{
	for(var i = 0; i<emailAddresses.length; i++)
	{
		Logger.log(data);
}
	}