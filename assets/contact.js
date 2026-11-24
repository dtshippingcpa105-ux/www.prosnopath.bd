(() => {
  const get = PB.id;
  const form = get("feedbackForm");
  const preview = get("feedbackPreview");
  const status = get("feedbackStatus");
  const input = get("feedbackText");
  const emailLink = get("feedbackEmail");
  const address = typeof SITE !== "undefined" ? SITE.email.trim() : "";
  const hasEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(address);
  const page = PB.params().get("page");
  if (page) get("feedbackUrl").value = page.slice(0, 300);

  if (hasEmail) {
    const channel = get("contactChannel");
    const link = document.createElement("a");
    link.href = "mailto:" + address;
    link.textContent = address;
    channel.replaceChildren("ইমেইলে মতামত দিন ", link, "।");
  }
  get("feedbackCreate").disabled = false;

  input.addEventListener("input", () => input.setCustomValidity(""));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const description = input.value.trim();
    if (!description) {
      input.setCustomValidity("সমস্যার বিবরণ লিখুন।");
      input.reportValidity();
      return;
    }
    const category = get("feedbackType").value;
    const pageUrl = get("feedbackUrl").value.trim();
    preview.value = "প্রশ্নপাঠ — " + category + (pageUrl ? "\nপেজ: " + pageUrl : "") + "\n\n" + description;
    get("feedbackDraft").hidden = false;
    if (hasEmail) {
      emailLink.href = "mailto:" + address + "?subject=" + encodeURIComponent("প্রশ্নপাঠ — " + category)
        + "&body=" + encodeURIComponent(preview.value.toWellFormed());
      emailLink.hidden = false;
    }
    status.textContent = "খসড়া তৈরি হয়েছে।";
    preview.focus();
  });

  get("feedbackCopy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(preview.value);
      status.textContent = "খসড়া কপি করা হয়েছে।";
    } catch {
      preview.focus();
      preview.select();
      status.textContent = "লেখা নির্বাচন করা হয়েছে। কীবোর্ড বা টাচ মেনু থেকে কপি করুন।";
    }
  });

  get("feedbackDownload").addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([preview.value], { type: "text/plain;charset=utf-8" }));
    const download = document.createElement("a");
    download.href = url;
    download.download = "proshno-path-feedback.txt";
    download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "খসড়ার ডাউনলোড চালু হয়েছে।";
  });
})();
