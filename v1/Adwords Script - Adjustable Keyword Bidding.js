var KEYWORD_PREVIOUS_PARAMETERS_SPREADSHEET_LINK = "";
var THRESHOLD_KEYWORD_PARAMETERS_SPREADSHEET_NAME = "";
var THRESHOLD_KEYWORD_PARAMETERS = 
	{
		//"maxCPC":50.0,
		"QS":2.0,
		//"avgCPC":50.0,
		//"avgCPM":50.0,
		//"avgPageviews":50.0,
		//"avgPosition":50.0,
		//"avgTimeOnSite":50.0,
		"avgBounceRate":0.5,
		"avgClickConversionRate":0.01,
		"avgClicks":50.0,
		"avgConvertedClicks":50.0,
		"Cost":50.0,
		"CTR":50.0,
		"Impressions":50.0		
	};
var DATE_PERIOD = "LAST_7_DAYS";
var BID_ADJUSTMENT_COEFFICIENT = 1.10;
var ADJUSTED_KEYWORD_LABEL = "AUTOMATICALLY_ADJUSTED";
function main() 
{ 
	var keywords = AdWordsApp.keywords()
		.withCondition("Status = ENABLED")
		.withCondition("AverageCpc < " + THRESHOLD_KEYWORD_PARAMETERS["avgCPC"])
		.withCondition("QualityScore > " + THRESHOLD_KEYWORD_PARAMETERS["QS"])
		.withCondition("ConversionRate > " + THRESHOLD_KEYWORD_PARAMETERS["avgClickConversionRate"])
		.withCondition("AveragePageviews > " + THRESHOLD_KEYWORD_PARAMETERS["avgPageviews"])
		.forDateRange(DATE_PERIOD)
		.get();
	
	while(keywords.hasNext())
	{
		var keyword = keywords.next();
		
		if(keyword.getMaxCpc() < keyword.getTopOfPageCpc && keyword.getMaxCpc() < keyword.getFirstPageCpc() )
		{
			saveKeywordStats(keyword);
			keyword.applyLabel(ADJUSTED_KEYWORD_LABEL);
			keyword.setMaxCpc *= BID_ADJUSTMENT_COEFFICIENT;
		}
	}
}

function saveKeywordParameters(keyword)
{
	var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1QqP0MT-XSVD3iTJsJA_EwNoNcHcGsgwFALmrALlhXiY");
	
	var row = [
				new Date().toISOString(), 
				keyword.getId(), 
				keyword.getText(), 
				keyword.getMatchType(), 
				keyword.getCampaign(), 
				keyword.getAdGroup(), 
				keyword.getMaxCpc(), 
				keyword.getQualityScore()
			];
	ss.appendRow(row);
}

function resetKeywordParameters(keyword)
{
	var ss = SpreadsheetApp.openByUrl("https://docs.google.com/spreadsheets/d/1QqP0MT-XSVD3iTJsJA_EwNoNcHcGsgwFALmrALlhXiY");
	var values = sheet.getRange("A2:H" + sheet.getLastRow()).getValues();
	var latestDate = "";
	var originalMaxCPC = -1;
	for(var i = 0; i<values.length; i++)
	{
		if(values[i][1] == keyword.getText() && values[i][0] > latestDate)
		{
			originalMaxCPC = values[i][6];
			latestDate = values[i][0];
		}
	}
	
	if(latestDate != "" && originalMaxCPC != -1)
	{
		keyword.setMaxCpc(originalMaxCPC);
	}
}