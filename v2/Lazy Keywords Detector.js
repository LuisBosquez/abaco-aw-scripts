var ACCOUNT_NAMES = ["INAMI","FONART","SEP","EnTuCine","Weber","UTEL","Ingenes","Viajamex","CEMAC","Casas Ara - Abaco","Amex GCP"];
var MAX_IMPRESSIONS = 90;


function main() 
{  
	var mccAccount = AdWordsApp.currentAccount();
  
	for(var i = 0; i<ACCOUNT_NAMES.length; i++)
	{ 
		var accounts = MccApp.accounts()
	    .withCondition("Name STARTS_WITH '" + ACCOUNT_NAMES[i] + "'")
        .withCondition('Impressions > 1')
        .forDateRange("LAST_MONTH")
    	.get();

	    while(accounts.hasNext())
    	{
			var account = accounts.next();
            Logger.log("ACCOUNT: " + account.getName());
			MccApp.select(account);
			
    	}
	}
    MccApp.select(mccAccount);
}

function detectLazyKeywords()
{
	var result;
	
	var keywords = AdWordsApp.keywords()
  	.withCondition("Impressions < " + MAX_IMPRESSIONS)
    .orderBy("Text ASC")
    .forDateRange("LAST_WEEK")
    .get();
    
    
}