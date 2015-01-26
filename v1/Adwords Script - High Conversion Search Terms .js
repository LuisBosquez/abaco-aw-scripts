function main() {  
  var report = AdWordsApp.report(
   "SELECT AdGroupName, CampaignName, Query,MatchType, Clicks,Cost, AverageCpc,Ctr,ConversionRate,CostPerConversion,Conversions"+
   " FROM SEARCH_QUERY_PERFORMANCE_REPORT " +
   " WHERE " +
       " Conversions > 1" +
       " AND Impressions > " + 1 +
       " AND AverageCpc > " + 1 +
   " DURING LAST_MONTH");
  var rows = report.rows();
  
  var st_brn_ss = SpreadsheetApp.create("Search Terms: BRN - " + new Date().toDateString());
  var st_grc_ss = SpreadsheetApp.create("Search Terms: GRC - " + new Date().toDateString());
  st_brn_ss.appendRow(columns);
g  var columns = ["AdGroupName", "CampaignName", "Query", "MatchType", "Clicks","Cost", "AverageCpc","Ctr","ConversionRate","CostPerConversion","Conversions"];
  st_grc_ss.appendRow(columns);
  
  while(rows.hasNext())
  {
    var row = rows.next();
    var st_row = [row['AdGroupName'],row['CampaignName'],row['Query'], row['MatchType'], row['Clicks'],row['Cost'],row['AverageCpc'] ,row['Ctr'],row['ConversionRate'],row['CostPerConversion'],row['Conversions']];
    //Logger.log(row['CampaignName'] + "/" + row['AdGroupName']);
    if(row['Query'].search(/i[n,m]ge[n,m][e,es]/i) > -1)
    {      
       if(isNotAnExistingKeyword(row['Query'], row['MatchType']))
       {
         st_brn_ss.appendRow(st_row);
       }
    }
    else
    {
      if(isNotAnExistingKeyword(row['Query'], row['MatchType']))
      {
        st_grc_ss.appendRow(st_row);
      }
    }
  }
  
  st_brn_ss.sort(8,false);
  st_grc_ss.sort(8,false);
  
  Logger.log(st_brn_ss.getName());
  Logger.log(st_brn_ss.getUrl());
  Logger.log(st_grc_ss.getName());
  Logger.log(st_grc_ss.getUrl());
}

function isNotAnExistingKeyword(searchTerm, matchType)
{
  var keywords = AdWordsApp.keywords()
    .withCondition("Impressions > 1")
    .withCondition("Text CONTAINS_IGNORE_CASE '" + searchTerm + "'")
    .orderBy("Text ASC")
    .forDateRange("LAST_MONTH")
    .get();
  while(keywords.hasNext())
  {
     var keyword = keywords.next();
     var keywordText = keyword.getText().replace(/[\[,\],",+]/g,"");
    Logger.log("kw:" + keywordText + " mt:" + keyword.getMatchType() + "campaign/adgroup: " + keyword.getCampaign().getName() + "/" + keyword.getAdGroup().getName() + " || st:" + searchTerm + " mt:" + matchType);
     if(searchTerm.toLowerCase().localeCompare(keywordText.toLowerCase()) == 0 && matchType.toLowerCase().localeCompare(keyword.getMatchType().toLowerCase()) == 0)
     { 
       Logger.log("Existing keyword + match type combination");
       return false;
     } 
  }
  Logger.log("non existant keyword + match combination. st:" + searchTerm + " mt:" + matchType);
  return true;
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