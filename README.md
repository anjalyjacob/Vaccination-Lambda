# Vaccination-Lambda
 Lambda for calling vaccination api regularly with AWS cloudwatch and SES.
 
 Initially will send email if centers are available then will send email if the center is not available.
 Time gap is 5 mins

 Wrote api calls for Ernakulam and Idukki districts.
 Main api calls is here: https://apisetu.gov.in/public/marketplace/api/cowin

 Sample url:https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=544&date=01-05-2021
