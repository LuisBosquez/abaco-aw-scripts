var ACCOUNT_NAMES = ["INAMI","FONART","SEP","EnTuCine","Weber","UTEL","Ingenes","Viajamex","CEMAC","Casas Ara - Abaco","Amex GCP"];
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

var MIN_CONVERSIONS = 1;
var MIN_IMPRESSIONS = 1;
var MIN_AVG_CPC = 1;

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
			
			var highConversionSearchTerms = getHighConversionSearchTerms();
			var spreadsheet = null;
			if(highConversionSearchTerms.length > 0)
			{
				spreadsheet = exportSearchTerms(account, highConversionSearchTerms);
				if(MailApp.getRemainingDailyQuota() > 1 && spreadsheet != null)
            	{
            		sendEmailNotification(account, spreadsheet, ACCOUNT_TO_EMAILS[ACCOUNT_NAMES[i]]);
            	}
			}
			
    	}
	}
    MccApp.select(mccAccount);
}

function getHighConversionSearchTerms()
{
	var highConversionSearchTerms = [];
	var report = AdWordsApp.report(
		"SELECT AdGroupName, CampaignName, Query,MatchType, Clicks,Cost, AverageCpc,Ctr,ConversionRate,CostPerConversion,Conversions"+
		" FROM SEARCH_QUERY_PERFORMANCE_REPORT " +
		" WHERE " +
		   " Conversions > " + MIN_CONVERSIONS +
		   " AND Impressions > " + MIN_IMPRESSIONS +
		   " AND AverageCpc > " + MIN_AVG_CPC +
		" DURING LAST_MONTH");
    var rows = report.rows();
    while(rows.hasNext())
  	{
  		var row = rows.next();
  		if(isExistingKeyword(row['Query'], row['MatchType']))
		{
			continue;
		}
		
		highConversionSearchTerms.push([row['AdGroupName'],row['CampaignName'],row['Query'], row['MatchType'], row['Clicks'],row['Cost'],row['AverageCpc'] ,row['Ctr'],row['ConversionRate'],row['CostPerConversion'],row['Conversions']]);
  	}
  	
  	return highConversionSearchTerms;
}

function exportSearchTerms(account, searchTerms)
{
	var spreadsheet = SpreadsheetApp.create(account.getName() + ": Search Terms - " + new Date().toDateString());
	var columns = ["AdGroupName", "CampaignName", "Query", "MatchType", "Clicks","Cost", "AverageCpc","Ctr","ConversionRate","CostPerConversion","Conversions"];
 	spreadsheet.appendRow(columns); 

    DriveApp.getFileById(spreadsheet.getId()).setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
    
    if(searchTerms.length < 1)
    {
    	return null;
    }
    
    for(var i = 0; i<searchTerms.length; i++)
    {
    	spreadsheet.appendRow(searchTerms[i]);
    } 
    spreadsheet.sort(11, false);
    return spreadsheet;
}

function isExistingKeyword(searchTerm, matchType)
{
  var keywords = AdWordsApp.keywords()
  	.withCondition("Impressions > 1")
    .withCondition("Text CONTAINS_IGNORE_CASE '" + searchTerm + "'")
    .orderBy("Text ASC")
    .forDateRange("LAST_WEEK")
    .get();
    
  while(keywords.hasNext())
  {
     var keyword = keywords.next();
     var keywordText = keyword.getText().replace(/[\[,\],",+]/g,"");
     var keywordTextValue = keywordText.replace("(close variant)","");
     searchTerm = searchTerm.replace("(close variant)","").trim();
     if(searchTerm.toLowerCase().localeCompare(keywordTextValue.toLowerCase()) == 0 && matchType.toLowerCase().localeCompare(keyword.getMatchType().toLowerCase()) == 0)
     { 
       return true;
     } 
  }
  return false;
}

function createKeyword(term)
{
     var adGroupName = ""
     var adGroupIterator = AdWordsApp.adGroups()
     .withCondition('Name = "'+ adGroupName +'"')
        .get();
     if (adGroupIterator.hasNext()) {
        var adGroup = adGroupIterator.next();
        //adGroup.createKeyword(term);
     }
}

function sendEmailNotification(account, data, emailAddresses)
{
	var SUBJECT = account.getName() + ": Reporte de Search Terms con altas conversiones. " + _getDateString();
    var recipients = "";
	var EMAIL_BODY = "Hola, \nEn las siguientes Spreadsheets se encuentran los Search Terms, divididos entre Branded y no-Branded, para lo cuales \n";
	for(var i = 0; i<emailAddresses.length; i++)
	{	
    	recipients += emailAddresses[i];
        if(emailAddresses.length > 1 && i < (emailAddresses.length - 1))
        {
           recipients += ",";
        }
	}
	EMAIL_BODY += "\n" + data.getName();
	EMAIL_BODY += "\n" + data.getUrl();
	EMAIL_BODY += "\n";
    EMAIL_BODY += "\nSaludos.";
    EMAIL_BODY += "\n-Robot de Adwords de Ábaco";
    MailApp.sendEmail("luis.bosquez@abacometrics.com", SUBJECT, EMAIL_BODY);
}

function _getDateString() {
  return Utilities.formatDate((new Date()), AdWordsApp.currentAccount().getTimeZone(), "yyyy-MM-dd");
}

function _getFullDateString() {
  return Utilities.formatDate((new Date()), AdWordsApp.currentAccount().getTimeZone(), "yyyy-MM-dd HH:MM:SS");
}