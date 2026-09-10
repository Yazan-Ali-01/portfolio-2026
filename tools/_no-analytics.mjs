/**
 * Belt and braces for the browser tools.
 *
 * The site already refuses to run analytics off its production hosts or under a
 * headless browser, so a local run cannot leak. This exists for the case where a
 * tool is deliberately pointed at the live site: it opts the browser out and, if
 * anything still tries, aborts the request before it leaves the machine.
 *
 * tools/analytics-check.mjs is the one caller that must NOT use this, since its
 * whole job is to exercise the loader.
 */
export async function blockAnalytics(context) {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('yz_optout', '1');
    } catch {
      /* private mode */
    }
  });
  await context.route(/clarity\.ms|\/_vercel\/(insights|speed-insights)/, (route) => route.abort());
}
