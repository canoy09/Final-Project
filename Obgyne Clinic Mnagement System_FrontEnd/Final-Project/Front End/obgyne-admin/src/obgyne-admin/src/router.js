// Tiny client-side router (no extra package needed).
//   navigate('/patients/3')          go to a page (adds a history entry)
//   navigate('/schedule', { replace: true })
//   usePath()                        current "/path?query", re-renders on change
//   <a {...linkProps('/patients')}>  a normal link that does not reload the page
import { useSyncExternalStore } from 'react'

const EVENT = 'obgyne:navigate'

export function navigate(path, { replace = false } = {}) {
  if (window.location.pathname + window.location.search === path) return
  window.history[replace ? 'replaceState' : 'pushState'](null, '', path)
  window.dispatchEvent(new Event(EVENT))
}

// Updates the address bar only (no re-render). Used to remember search/page in the URL.
export function replaceUrl(path) {
  if (window.location.pathname + window.location.search !== path) {
    window.history.replaceState(null, '', path)
  }
}

function subscribe(callback) {
  window.addEventListener('popstate', callback)
  window.addEventListener(EVENT, callback)
  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener(EVENT, callback)
  }
}

export function usePath() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname + window.location.search,
    () => '/',
  )
}

export function linkProps(href) {
  return {
    href,
    onClick(e) {
      // let ctrl/cmd/middle-click open a new tab as usual
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      e.preventDefault()
      navigate(href)
    },
  }
}
