import waitForElement from "wait-for-element";
import { parseTimeFromSubscriptionAnchor } from "./reservise-api";

// PATCH
// In the "Extend Subscription" wizard, the hour is always set to 0:00.
// Set it to the subscription's hour instead

document.addEventListener(
  "click",
  ({ target }) => {
    if (target.classList && target.classList.contains("edit-subscription")) {
      // console.log('editing subscription')
      const panel = target.closest("#subscriptions-accordion > .panel");
      const anchor = panel.querySelector('a[href^="#subscription-collapse-"]');
      const info = parseTimeFromSubscriptionAnchor(anchor, { partial: true });
      const timeout = 10 * 1000; // ms
      waitForElement("form.form-subscription", timeout)
        .then((_subscriptionForm) => {
          // console.log('form present', subscriptionForm.outerHTML)
          const startTimeInput = document.getElementById("id_time-start_time");
          const durationInput = document.getElementById("id_time-duration");
          // console.log('setting inputs', startTimeInput, durationInput, info)
          startTimeInput.value = info.start.replace(/^0(?=\d)/, ""); // strip leading zero
          if (info.duration !== null) {
            durationInput.value = `${info.duration}:00`;
          }
        })
        .catch((err) => console.error(err));
    }
  },
  { passive: true }
);
