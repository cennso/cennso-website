import Cookies from 'js-cookie'
//TODO imho cookies that we use, for token storing, is not something that requires cookie banner consent. Something to evaluate later


export function getCookie(name: string) {
  if (typeof window === 'undefined') {
    return
  }
  return Cookies.get(name)
}

export function setCookie(name: string, value: string, expires = 365): void {
  if (typeof window === 'undefined') {
    return
  }
  Cookies.set(name, value, { expires, path: '/' })
}
