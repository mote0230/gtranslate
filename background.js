/* global browser, translate, translateUrl, translatePageUrl, LABEL_TRANSLATE_ERROR, _ */

const sp = browser.storage.sync;

const translatePageId = 'gtranslate_page';
const translateMenuId = 'gtranslate_selection';
const resultId = 'gtranslate_result';
const copyToClipboardId = 'gtranslate_clipboard';

// Replace params in a string a la Python str.format()
const format = (origStr, ...args) => Array.from(args).reduce(
  (str, arg, i) => str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg), origStr
);

// Open a new tab near to the active tab
function openTab(url, currentTab) {
    browser.tabs.create({url: url,
			 active: true,
			 openerTabId: currentTab.id,
			 index: currentTab.index + 1});
};

// Get the To language from the preferences
async function currentTo(langToPref) {
    let langCode = langToPref || (await sp.get("langTo")).langTo;
    const locale = browser.i18n.getUILanguage();
  if (langCode === 'auto') {
    if (!locale.startsWith('zh')) {
	langCode = locale.replace(/-[a-zA-Z]+$/, '');
    }
  }
    return langCode;
};

async function translatePage(info, tab) {
    const from = (await sp.get("langFrom")).langFrom;
    const to = await currentTo();
    openTab(translatePageUrl(from, to, tab.url), tab);
}

async function translateSelectionNewTab(info, tab) {
    const from = (await sp.get("langFrom")).langFrom;
    const to = await currentTo();
    openTab(translateUrl(from, to, info.selectionText || info.linkText));
}

async function getLangMenuLabel() {
    const from = (await sp.get("langFrom")).langFrom;
    const to = await currentTo();
    return format(_('translate_page'), from, to);
}

async function addTranslatePageItem() {
    const langMenuLabel = await getLangMenuLabel();
    browser.menus.create({
	id: translatePageId,
	title: langMenuLabel,
	icons: {'16': 'data/menuitem.svg'},
	contexts: ['page'],
	onclick: translatePage
    });
}

async function init() {
    if ((await sp.get("fullPage")).fullPage)
	addTranslatePageItem();
}

init();

browser.menus.onShown.addListener((info, tab) => {
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync') {
	const fullPage = changes.fullPage;
	if (!fullPage.oldValue && fullPage.newValue)
	    addTranslatePageItem();
	else if (fullPage.oldValue && !fullPage.newValue)
	    browser.menus.remove(translatePageId);
	else if (fullPage.oldValue && fullPage.newValue) {
	    const from = changes.langFrom.newValue;
	    const to = await currentTo(changes.langTo.newValue);
	    browser.menus.update(translatePageId, {
		title: format(_('translate_page'), from, to)
	    });
	}
    }
});
