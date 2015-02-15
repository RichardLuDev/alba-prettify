// Google analytics tracking only for live extension or testing.
if (!isDevMode() || DEBUG_ANALYTICS) {
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

	ga('create', 'UA-12588142-8', 'auto');
	ga('set', 'checkProtocolTask', null);  // http://stackoverflow.com/a/22152353
	ga('send', 'event', 'background', 'start', getVersion());

	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			if (request.type === 'analytics') {
				ga('send', request.object);
			}
		});
}