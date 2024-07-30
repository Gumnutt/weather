import { fetchWeatherApi } from "openmeteo"
import { codes } from "./wmoCodes"

const params = {
  latitude: -35.2835,
  longitude: 149.1281,
  past_days: 7,
  current: ["temperature_2m", "apparent_temperature", "weather_code"],
  hourly: ["temperature_2m", "apparent_temperature", "weather_code"],
  daily: ["weather_code", "temperature_2m_max", "temperature_2m_min"],
}

const url = "https://api.open-meteo.com/v1/forecast"

const range = (start, stop, step) => Array.from({ length: (stop - start) / step }, (_, i) => start + i * step)

export const processWeatherData = async () => {
  const responses = await fetchWeatherApi(url, params)
  const response = responses[0]

  const utcOffsetSeconds = response.utcOffsetSeconds()
  const hourly = response.hourly()
  const current = response.current()
  const daily = response.daily()

  const weatherData = {
    current: {
      time: new Date((Number(current.time()) + utcOffsetSeconds) * 1000),
      temperature: Math.round(current.variables(0).value()),
      apparentTemperature: Math.round(current.variables(1).value()),
      weatherCode: codes[current.variables(2).value()].day.description,
    },
    hourly: {
      time: range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      temperature: hourly
        .variables(0)
        .valuesArray()!
        .map((v) => Math.round(v)),
      apparentTemperature: hourly
        .variables(1)
        .valuesArray()!
        .map((v) => Math.round(v)),
      weatherCode: hourly
        .variables(2)
        .valuesArray()!
        .map((v) => codes[v].day.description),
    },
    daily: {
      time: range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map((t) => new Date((t + utcOffsetSeconds) * 1000)),
      weatherCode: codes[Number(daily.variables(0).value())].day.description,
      temperatureMax: daily
        .variables(1)
        .valuesArray()!
        .map((v) => Math.round(v)),
      temperatureMin: daily
        .variables(2)
        .valuesArray()!
        .map((v) => Math.round(v)),
    },
  }

  return weatherData
}
