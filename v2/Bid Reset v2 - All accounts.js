var ACCOUNT_NAMES = ["INAMI","FONART","SEP","EnTuCine","Weber","UTEL","Ingenes","Viajamex","CEMAC","Casas Ara - Abaco","Amex GCP"];
var ACCOUNT_TO_EMAILS = 
{
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
			
			var keywords = AdWordsApp.keywords()
                .withCondition('LabelNames CONTAINS_ANY [\'' + MODIFIED_LABEL + '\']')
                .get();
          
          Logger.log("Total: " + keywords.totalNumEntities());
			while(keywords.hasNext())
			{
				var keyword = keywords.next();	
				var result = setPreviousConfigForKeyword(keyword);
				if(!result)
				{
					Logger.log("Value not found");
				}
			}
    	}
	}
    MccApp.select(mccAccount);
}

function setPreviousConfigForKeyword(keyword)
{
	var ss = SpreadsheetApp.openById(SPREADSHEET_PREVIOUS_KEYWORD_PARAMS_ID);
	var values = ss.getRange("A2:"+ss.getLastRow()+""+ss.getLastColumn()).getValues();
	for(var i = 0; i<values.length; i++)
	{
        if(values[i][1].length < 1)
        {
          return false;
        }
		if(keyword.getId() == values[i][1])
		{
			Logger.log("Setting value to: " + values[i][4]);
            keyword.setMaxCpc(values[i][4]);

			ss.deleteRow(i + 2);
			return true;
		}

	}
	return false;
}