var ACCOUNT_NAMES = ["UTEL - Search", "UTEL - Display", "UTEL - Vocacional"];
var APPROVED_BUDGETS = {"UTEL - Search":33000, "UTEL - Display":16500, "UTEL - Vocacional":30000};
var TIME_PERIOD = "LAST_MONTH";
var BID_ADJUSTMENT_COEFFICIENT = 1.1;
var THRESHOLD_KEYWORD_PARAMETERS = {"Conversions":1};
var MODIFIED_LABEL = "CPC AJUSTADO CON SCRIPT";
var SPREADSHEET_PREVIOUS_KEYWORD_PARAMS_ID = "1e_rjF916-cVBSlg5OVCGm_CHZCAjN9Z68z0Q9ETr5e0";

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
            var label = AdWordsApp.labels()
                .withCondition("Name CONTAINS '" + MODIFIED_LABEL + "'")
                .get();
            if(label.totalNumEntities() < 1)
            {
              AdWordsApp.createLabel(MODIFIED_LABEL);
            }  
            if(getAccountBudget() < APPROVED_BUDGET[ACCOUNT_NAMES[i]])
				adjustBids(account);
    	}
	}
    MccApp.select(mccAccount);
}

function getAccountBudget()
{
	var campaigns = AdWordsApp.campaigns()
		.withCondition("Status = ENABLED")
		.forDateRange("TODAY")
		.get();
	var totalBudget = 0;
	while(campaigns.hasNext())
	{
		var campaign = campaigns.next();
		var budget = campaign.getBudget().getAmount();
		totalBudget += budget;
	}
	
	return totalBudget;
}

function adjustBids(account)
{
	var stats = account.getStatsFor(TIME_PERIOD);
	
	THRESHOLD_KEYWORD_PARAMETERS["AccountAvgCostPerConversion"] = stats.getCost()/stats.getConvertedClicks();
	
	var keywords = AdWordsApp.keywords()
		.withCondition("Status = ENABLED")
		.withCondition("Conversions > " + THRESHOLD_KEYWORD_PARAMETERS["Conversions"])
		.forDateRange(TIME_PERIOD)
		.get();
		
	while(keywords.hasNext())
	{
		var keyword = keywords.next();
		var keywordStats = keyword.getStatsFor(TIME_PERIOD);
		var budget = AdWordsApp.budgets().
				forDateRange("TODAY");
		if((keywordStats.getCost()/keywordStats.getConvertedClicks()) <=  THRESHOLD_KEYWORD_PARAMETERS["AccountAvgCostPerConversion"])
		{
			Logger.log("Id: " + keyword.getId() +"  Text: " + keyword.getText() + " MaxCpc: " + keyword.getMaxCpc() + "  TopOfPageCpc: " + keyword.getTopOfPageCpc());
			saveCurrentBids(keyword, account);
			keyword.setMaxCpc(keyword.getTopOfPageCpc()*BID_ADJUSTMENT_COEFFICIENT);
			keyword.applyLabel(MODIFIED_LABEL);
			Logger.log("MODIFIED   Id: " + keyword.getId() +"  Text: " + keyword.getText() + " MaxCpc: " + keyword.getTopOfPageCpc()*BID_ADJUSTMENT_COEFFICIENT);
		}
	}
}

function saveCurrentBids(keyword, account)
{
	var ss = SpreadsheetApp.openById(SPREADSHEET_PREVIOUS_KEYWORD_PARAMS_ID);
	if(!previousConfigExists(keyword, ss))
	{
		var row = 
			[
				new Date().toISOString(), 
				keyword.getId(), 
				keyword.getText(), 
				keyword.getMatchType(), 
				keyword.getMaxCpc(), 
				keyword.getQualityScore(),
				account.getName(),
				keyword.getCampaign().getName(), 
				keyword.getAdGroup().getName()
			];
		ss.appendRow(row);
	}
}

function previousConfigExists(keyword, ss)
{
	var values = ss.getRange("A2:"+ss.getLastRow()+""+ss.getLastColumn()).getValues();
	for(var i = 0; i<values.length; i++)
	{
        if(values[i][1].length < 1){	return false;	}
		if(keyword.getId() == values[i][1]){	return true;	}
	}
	return false;
}