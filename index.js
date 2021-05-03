var axios = require('axios');
var aws = require("aws-sdk");
const SESCONFIG = {
    apiVersion: '2010-12-01',
    region: 'ap-south-1'
}
var ses = new aws.SES(SESCONFIG);
exports.handler = (event, context, callback) => {
    findVaccinationCenters();
};

const findVaccinationCenters = () => {
    console.log("findVaccinationCenters");
    var today = new Date();
    var dd = String(today.getDate() + 1).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + '-' + mm + '-' + yyyy;
    let url1 = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=307&date=" + today + "&state_id=17";
    let url2 = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=306&date=" + today + "&state_id=17";
    const requestOne = axios.get(url1);
    const requestTwo = axios.get(url2);
    axios.all([requestOne, requestTwo]).then(axios.spread(async (...responses) => {
        // handle success
        var a = responses[0].data.centers;
        var b = responses[1].data.centers;
        var centersData = a.concat(b);
        let value = await setData(centersData);
        let count = centersData.length;
        if (value) {
            value = value;
        } else {
            value = `<html><div>Center is unavailable</div></html>`;
            count = 0;
        }
        axios({
            method: 'put',
            url: 'http://nodeserver-env.eba-r2q34gwg.ap-south-1.elasticbeanstalk.com/vaccination/checkVaccination',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ "count": count })
        })
            .then(function (resp) {
                console.log("in count")
                if (resp && resp.data && resp.data.message) {
                    console.log("in sending message")
                    var params = {
                        Destination: {
                            ToAddresses: ['anjalyjkk021@gmail.com'],
                        },
                        Message: {
                            Body: {
                                Html: { Data: value }
                            },

                            Subject: { Data: "Vaccination centers" },
                        },
                        Source: 'anjalyjkk021@gmail.com',
                    };

                    var sendPromise = ses.sendEmail(params).promise();
                    // Handle promise's fulfilled/rejected states
                    sendPromise.then(
                        function (data) {
                            console.log(data.MessageId);
                        }).catch(function (err) {
                                console.error(err, err.stack);
                            });

                }

            }).catch(errors => {
                console.log(errors)

            });

    })).catch(errors => {
        findVaccinationCenters();
    });
}


const setData = (centers) => {

    var filtered = centers;
    if (filtered.length > 0) {
        let completed = 0;
        let vaccinationCenters = `<html>
        <head>
        <style>
        table {
          font-family: arial, sans-serif;
          border-collapse: collapse;
          width: 100%;
        }
        td, th {
          border: 1px solid #dddddd;
          text-align: left;
          width:25%;
        }
        </style>
        </head>
        <body>
        <h2>Vaccination available slots</h2>
        <table>
          <tr>
            <th>Center</th>
            <th>available capacity</th>
            <th>date</th>
            <th>slots</th></tr>`;
        let loopValues;
        filtered.forEach((findBypincode, index) => {
            findBypincode.sessions.forEach((session, ind) => {
                let value;
                if (parseInt(session.available_capacity) > 0) {
                    if (!loopValues) {
                        loopValues = vaccinationCenters;
                    }
                    let slots = session.slots.toString().split(",");
                    var res = slots.join(" <br> ");
                    value = `<tr><td>${findBypincode.name}</td><td>${session.available_capacity}</td><td>${session.date}</td><td>${res}</td></tr>`
                    loopValues += value;
                    if (index === (filtered.length - 1)) {
                        loopValues += `</table></body></html>`;
                    }
                }
                if (ind === (findBypincode.sessions.length - 1)) {
                    completed++;
                }
            });

        });
        if (completed === filtered.length) {
            return loopValues;
        }

    }

}
