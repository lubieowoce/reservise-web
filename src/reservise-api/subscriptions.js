import {
  hoursToMilliseconds,
  minutesToMilliseconds,
  millisecondsToHours,
  millisecondsToMinutes,
} from "date-fns";

import Cookies from "js-cookie";

const LANGUAGE_ENGLISH = "en";

export const getClientSubscriptions = (clientIds) => {
  return withLanguage(LANGUAGE_ENGLISH, () =>
    Promise.all(
      clientIds.map((clientId) => unsafe_getClientSubscriptions({ clientId }))
    )
  );
};

export const unsafe_getClientSubscriptions = async ({ clientId }) => {
  const resp = fetch(`/clients/client/${clientId}/get/subscriptions/`);
  const body = await resp.json();
  const el = createNode(body.html);
  const res = parseSubscriptionAccordion(el).map((subscriptionInfo) => ({
    clientId,
    ...subscriptionInfo,
  }));
  el.remove();
  return res;
};

const parseSubscriptionAccordion = (el) => {
  const subscriptionBoxes = [
    ...el.querySelectorAll(
      '.subscription-during a[href^="#subscription-collapse-"]'
    ),
  ];
  return subscriptionBoxes.map(parseSubscriptionAnchor);
};

export const parseTimeFromSubscriptionAnchor = (
  box,
  { partial = false } = {}
) => {
  const timeBox = box.querySelector(".subscription-dates");
  const timeStr = timeBox.innerText.replace(/\s+/g, " ");
  let [match, start, end] =
    timeStr.match(/, (\d\d?:\d\d) - (\d\d?:\d\d),/) || [];
  if (match === undefined) {
    throw new Error(timeStr);
  }

  let duration;
  try {
    duration = formatHour(parseHour(end) - parseHour(start), {
      padHour: false,
    });
  } catch (e) {
    if (partial) {
      duration = null;
    } else {
      throw e;
    }
  }

  return { start, duration };
};

export const parseSubscriptionAnchor = (box) => {
  const [, subscriptionId] =
    box.getAttribute("href").match(/^#subscription-collapse-(\d+)$/) || [];
  const courtName = box.querySelector(":scope > strong").innerText.trim();
  const timeBox = box.querySelector(".subscription-dates");
  const timeStr = timeBox.innerText.replace(/\s+/g, " ");
  let [match, day, start, end, periodStart, periodEnd] =
    timeStr.match(
      /(\w+), (\d\d?:\d\d) - (\d\d?:\d\d), from (.+ \d\d\d\d) to (.+ \d\d\d\d)/
    ) || [];
  if (match === undefined) {
    throw new Error(timeStr);
  }

  const duration = formatHour(parseHour(end) - parseHour(start), {
    padHour: false,
  });

  const parseDate = (s) => new Date(s.replaceAll(".", ""));
  try {
    periodStart = toISODateString(parseDate(periodStart));
    periodEnd = toISODateString(parseDate(periodEnd));
  } catch (e) {
    throw new RangeError(
      `One or more invalid dates: ${periodStart}, ${periodEnd}`
    );
  }
  return {
    subscriptionId,
    courtName,
    day,
    start,
    duration,
    periodStart,
    periodEnd,
  };
};

export const setLanguage = (lang) => {
  const csrfToken = Cookies.get("csrf-token");
  return fetch("https://reservise.com/i18n/setlang/", {
    method: "POST",
    body: formData({
      csrfmiddlewaretoken: csrfToken,
      language: lang,
    }),
    credentials: "include",
  });
};

export const withLanguage = async (lang, f) => {
  const prevLang = Cookies.get("django_language");
  // TODO - only if current lang different from desired
  throwOnHTTPError(await setLanguage(lang));
  try {
    return await f();
  } finally {
    throwOnHTTPError(await setLanguage(prevLang));
  }
};

const formData = (values) => {
  const res = new FormData();
  for (const [k, v] of Object.entries(values)) {
    res.append(k, v);
  }
  return res;
};

const throwOnHTTPError = (response, msg = null) => {
  if (response.ok) {
    return response;
  }
  if (msg === null) {
    msg = `[${response.status} ${response.statusCode}] ${response.url}`;
  }
  throw new Error(msg);
};

export const toISODateString = (date) => date.toISOString().split("T")[0];
// unsigned modulo: https://stackoverflow.com/a/17323608/5534735
const unsignedMod = (n, m) => ((n % m) + m) % m;

export const parseHour = (s) => {
  const [, hours, minutes] = s.match(/^(\d\d?):(\d\d)$/);
  return (
    hoursToMilliseconds(parseInt(hours)) +
    minutesToMilliseconds(parseInt(minutes))
  );
};

export const formatHour = (ms, { padHour = true } = {}) => {
  ms = unsignedMod(ms, hoursToMilliseconds(24));
  const hours = millisecondsToHours(ms);
  const minutes = millisecondsToMinutes(ms - hoursToMilliseconds(hours));
  let hoursS = `${hours}`;
  if (padHour) {
    hoursS = hoursS.padStart(2, "0");
  }
  return hoursS + ":" + `${minutes}`.padStart(2, "0");
};

const createNode = (html) => {
  const n = document.createElement("div");
  n.innerHTML = html;
  return n;
};
