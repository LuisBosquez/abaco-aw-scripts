function main() 
{
	var INCLUDE_PARAMS = false;
	var HTTP_OPTIONS = {
		muteHttpExceptions:true
	 };
	var BAD_CODES = [404, 500];
	
	var visitedLinks = {};
	var brokenLinkAds = [];
	
	var ads = AdWordsApp.ads()
		.withCondition("Status = 'ENABLED'")
		.withCondition("AdGroupStatus = 'ENABLED'")
		.withCondition("CampaignStatus = 'ENABLED'")
		.withCondition("Type = 'TEXT_AD'")
		.get();
	
	var j = 0;
	
	while(ads.hasNext() && j < 10)
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
				UrlFetchApp.fetch(url, HTTP_OPTIONS).getResponseCode();
			} 
			catch(e)
			{
				brokenLinkAds.push({"ad": ad, "code":response_code});
				visitedLinks[url] = response_code;
			}
			if(BAD_CODES.indexOf(response_code) >= 0)
			{
				brokenLinkAds.push({"ad": ad, "code":response_code});
				visitedLinks[url] = response_code;
			}
		}
		
		j++;
	}    
	
	for(var i = 0; i<brokenLinkAds.length; i++)
	{
		Logger.log("Ad. Id: " + brokenLinkAds[i].getId() + ". Headline: " + brokenLinkAds[i].getHeadline() + ". Desc1: " + brokenLinkAds[i].getHeadline());
	}
}