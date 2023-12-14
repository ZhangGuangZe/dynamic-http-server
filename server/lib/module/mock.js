const fs = require('fs');
const path = require('path');

let dataCache = null;

const loadData = () => {
  if (!dataCache) {
    const file = path.resolve(__dirname, '../mock/data.json');
    const data = JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }));
    const reports = data.dailyReports;
    dataCache = {};
    reports.forEach((report) => {
      dataCache[report?.updatedDate] = report;
    });
  }
  return dataCache;
};

const getCoronavirusKeyIndex = () => {
  return Object.keys(loadData());
};

const getCoronavirusByDate = date => {
  const dailyData = loadData()[date] || {};
  if (dailyData.countries) {
    dailyData.countries.sort((a, b) => b.confirmed - a.confirmed);
  }
  return dailyData;
};

module.exports = {
  getCoronavirusKeyIndex,
  getCoronavirusByDate
}