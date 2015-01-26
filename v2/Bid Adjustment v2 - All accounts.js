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
var TIME_PERIOD = "LAST_MONTH";
var BID_ADJUSTMENT_COEFFICIENT = 1.1;
var THRESHOLD_KEYWORD_PARAMETERS = {"Conversions":1};
var MODIFIED_LABEL = "AJUSTADO CON SCRIPT";
var SPREADSHEET_PREVIOUS_KEYWORD_PARAMS_LINK = "https://docs.google.com/a/abacometrics.com/spreadsheets/d/1e_rjF916-cVBSlg5OVCGm_CHZCAjN9Z68z0Q9ETr5e0/edit";

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
			adjustBids(account);
    	}
	}
    MccApp.select(mccAccount);
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
		
		Logger.log("Id: " + keyword.getId() +"  Text: " + keyword.getText() + " MaxCpc: " + keyword.getMaxCpc() + "  TopOfPageCpc: " + keyword.getTopOfPageCpc());
		if(
			keyword.getMaxCpc() < keyword.getTopOfPageCpc() && 
			(keywordStats.getCost()/keywordStats.getConvertedClicks()) <=  THRESHOLD_KEYWORD_PARAMETERS["AccountAvgCostPerConversion"]
		)
		{
			saveCurrentBids(keyword, account);
			//keyword.setMaxCpc(keyword.getTopOfPageCpc()*BID_ADJUSTMENT_COEFFICIENT);
			//keyword.applyLabel(MODIFIED_LABEL);
			Logger.log("MODIFIED   Id: " + keyword.getId() +"  Text: " + keyword.getText() + " MaxCpc: " + keyword.getTopOfPageCpc()*BID_ADJUSTMENT_COEFFICIENT);
		}
	}
}

function saveCurrentBids(keyword, account)
{
	var ss = SpreadsheetApp.openByUrl(SPREADSHEET_PREVIOUS_KEYWORD_PARAMS_LINK);
	
	var row = [
			new Date().toISOString(), 
			keyword.getId(), 
			keyword.getText(), 
			keyword.getMatchType(), 
			keyword.getMaxCpc(), 
			keyword.getQualityScore(),
			account.getName(),
			keyword.getCampaign(), 
			keyword.getAdGroup()
		];
	ss.appendRow(row);
}