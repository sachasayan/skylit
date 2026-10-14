/* Local, dependency-free search. Queries never leave the page. */
(function () {
  'use strict';
  var input = document.getElementById('guide-search');
  var results = document.getElementById('search-results');
  var status = document.getElementById('search-status');
  if (!input || !results) return;
  var indexPromise;
  var revision = 0;
  function close() { revision++; results.hidden = true; status.textContent = ''; }
  function search() {
    var query = input.value.trim().toLocaleLowerCase();
    var current = ++revision;
    if (!query) { close(); return; }
    if (!indexPromise) indexPromise = fetch('/docs/search.json').then(function (r) {
      if (!r.ok) throw new Error('Search unavailable');
      return r.json();
    }).catch(function (error) { indexPromise = null; throw error; });
    indexPromise.then(function (index) {
      if (current !== revision) return;
      var words = query.split(/\s+/);
      var matches = index.map(function (article) {
        var title = article.title.toLocaleLowerCase();
        var text = (title + ' ' + article.description + ' ' + article.text).toLocaleLowerCase();
        return {article: article, score: words.every(function (word) { return text.includes(word); }) ? 1 + words.filter(function (word) { return title.includes(word); }).length * 5 : 0};
      }).filter(function (item) { return item.score; }).sort(function (a, b) { return b.score - a.score; });
      results.replaceChildren();
      matches.forEach(function (item) {
        var a = document.createElement('a');
        a.href = item.article.url;
        var title = document.createElement('strong'); title.textContent = item.article.title;
        var description = document.createElement('span'); description.textContent = item.article.description;
        a.append(title, description); results.append(a);
      });
      if (!matches.length) { var empty = document.createElement('p'); empty.textContent = 'No matching guides. Try a shorter search, or browse the guides below.'; results.append(empty); }
      status.textContent = matches.length + (matches.length === 1 ? ' guide found' : ' guides found');
      results.hidden = false;
    }).catch(function () {
      if (current !== revision) return;
      results.replaceChildren(); var message = document.createElement('p');
      message.textContent = 'Search is unavailable. You can still browse every guide using the navigation.';
      results.append(message); results.hidden = false; status.textContent = message.textContent;
    });
  }
  input.addEventListener('input', search);
  input.addEventListener('focus', function () { if (input.value.trim()) search(); });
  input.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown' && !results.hidden && results.querySelector('a')) { event.preventDefault(); results.querySelector('a').focus(); }
    if (event.key === 'Escape') close();
  });
  results.addEventListener('keydown', function (event) {
    var links = Array.from(results.querySelectorAll('a')), at = links.indexOf(document.activeElement);
    if (event.key === 'Escape') { input.focus(); close(); }
    if (event.key === 'ArrowDown' && at < links.length - 1) { event.preventDefault(); links[at + 1].focus(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); if (at > 0) links[at - 1].focus(); else input.focus(); }
  });
  document.addEventListener('click', function (event) { if (!event.target.closest('.docs-search')) close(); });
})();
