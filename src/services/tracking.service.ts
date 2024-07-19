import { Request } from 'express';
import UAParser from 'ua-parser-js';
import requestIp from 'request-ip';

function _getBrowserString(parserInstance: UAParser.UAParserInstance) {
  let completeString = '';

  let browserString = '';
  const browserInfo = parserInstance.getBrowser();
  if (browserInfo.name) {
    browserString += browserInfo.name;
    if (browserInfo.version) {
      browserString += ` ${browserInfo.version}`;
    }
  }

  let osString = '';
  const osInfo = parserInstance.getOS();
  if (osInfo.name) {
    osString += osInfo.name;
    if (osInfo.version) {
      osString += ` ${osInfo.version}`;
    }
  }

  if (browserString) {
    completeString = browserString;
    if (osString) {
      completeString += ` / ${osString}`;
    }
  } else if (osString) {
    completeString = osString;
  }

  return completeString;
}

function _getLocationString(city: string, country: string) {
  let locationString = '';
  if (city) {
    locationString += city;
    if (country) {
      locationString += ', ' + country;
    }
  } else if (country) {
    locationString += country;
  }

  return locationString;
}

async function _getUserGeoData(userIp: string) {
  const userGeoData = {
    city: '',
    countryName: '',
  };

  try {
    const res = await fetch(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IP_GEOLOCATION_API_KEY}&ip=${userIp}&fields=geo`,
    );
    if (!res.ok) {
      const error = await res.json();
      throw Error(error.message);
    }
    const data = await res.json();
    userGeoData.city = data.city;
    userGeoData.countryName = data['country_name'];
  } finally {
    return userGeoData;
  }
}

async function getUserTrackingInfo(req: Request) {
  const clientIp = requestIp.getClientIp(req) || '';
  const userGeoData = _getUserGeoData(clientIp);

  const userAgentString = req.get('User-Agent') || '';
  const userAgentParser = new UAParser(userAgentString);
  const browserInfo = _getBrowserString(userAgentParser);

  const { city, countryName } = await userGeoData;
  const location = _getLocationString(city, countryName);

  return { ipAddress: clientIp, location, browserInfo };
}

export { getUserTrackingInfo };
