(() => {
  const get = PB.id;
  const form = get("feedbackForm");
  const preview = get("feedbackPreview");
  const status = get("feedbackStatus");
  const input = get("feedbackText");
  const emailLink = get("feedbackEmail");
  const address = typeof SITE.email === "string" ? SITE.email.trim() : "";
  const hasEmail = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(address);
  const type = get("feedbackType");
  const issueLink = get("feedbackIssue");
  const params = PB.params();
  const page = params.get("page");
  const question = (params.get("question") || "").slice(0, 250);

  if ([...type.options].some((option) => option.value === params.get("type"))) type.value = params.get("type");
  if (page) {
    const url = URL.canParse(page, location.href) ? new URL(page, location.href) : null;
    if (url?.origin === location.origin && url.href.length <= 1400) get("feedbackUrl").value = url.href;
  }
  if (question) {
    const context = get("feedbackQuestion");
    context.textContent = "সংশ্লিষ্ট প্রশ্ন — " + question;
    context.hidden = false;
  }

  if (hasEmail) {
    const channel = get("contactChannel");
    const link = document.createElement("a");
    link.href = "mailto:" + address;
    link.textContent = address;
    channel.replaceChildren("ইমেইলে মতামত দিন ", link, "।");
    channel.hidden = false;
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
    const category = type.selectedOptions[0].textContent;
    const pageUrl = get("feedbackUrl").value.trim();
    const title = "প্রশ্নপাঠ — " + category;
    preview.value = [pageUrl && "পেজ: " + pageUrl, question && "প্রশ্ন: " + question, description].filter(Boolean).join("\n\n");
    const issue = new URL(issueLink.href);
    issue.searchParams.set("title", title);
    issueLink.href = issue.href;
    get("feedbackDraft").hidden = false;
    if (hasEmail) {
      emailLink.href = "mailto:" + address + "?subject=" + encodeURIComponent(title)
        + "&body=" + encodeURIComponent(preview.value.toWellFormed());
      emailLink.hidden = false;
    }
    status.textContent = "খসড়া কপি করে GitHub-এর বিবরণ ঘরে পেস্ট করুন।";
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
