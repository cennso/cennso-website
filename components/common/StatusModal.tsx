import { Fragment, useState, useCallback, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import { Button } from '@cennso/ui'

import { LoadingIndicator } from './LoadingIndicator'

import siteMetadata from '../../siteMetadata'

import type { FunctionComponent, Dispatch, SetStateAction } from 'react'

interface StatusModalProps {
  action: 'none' | 'sending' | 'success' | 'error'
  setAction: Dispatch<SetStateAction<'none' | 'sending' | 'success' | 'error'>>
  kind: 'email' | 'job submission'
  content?: Record<string, any>
}

export const StatusModal: FunctionComponent<StatusModalProps> = ({
  action,
  setAction,
  kind,
  content,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { contact } = siteMetadata

  useEffect(() => {
    if (action !== 'none') {
      setIsOpen(true)
    }
  }, [action])

  const onClose = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      setAction('none')
    }, 300)
  }, [setIsOpen, setAction])

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                {/* The cookie banner's surface: card fill, the theme's border and
                    foreground, 24px corner and the shadow overlays float on -
                    so the modal follows the theme instead of staying white. */}
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-card text-foreground border border-border p-6 text-left align-middle shadow-lg transition-all">
                  {action === 'sending' ? (
                    <div className="w-full h-full flex flex-row items-center justify-center">
                      <LoadingIndicator className="text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* Programmatic status region for assistive technologies */}
                      <div aria-live="polite" role="status" className="sr-only">
                        {action === 'success' &&
                          (content?.form?.statusMessages?.success ||
                            'Submission completed successfully.')}
                        {action === 'error' &&
                          (content?.form?.statusMessages?.error ||
                            'An error occurred while sending the submission.')}
                      </div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-semibold leading-6"
                      >
                        Sending {kind}{' '}
                        {action === 'success' ? 'successfully' : 'error'}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">
                          {action === 'success' ? (
                            <span>
                              Your {kind} has been successfully sent. Please
                              wait for the feedback message.
                            </span>
                          ) : (
                            <span>
                              An error occurred while sending the {kind}. Try
                              again later. If the problem still occurs, please
                              contact us by
                              <a
                                href={`mailto:${contact.email}`}
                                rel="noopener"
                                className="font-semibold text-primary underline hover:decoration-2"
                              >
                                {' '}
                                {contact.email}{' '}
                              </a>
                              email.
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-row w-full justify-end">
                        <Button type="button" variant="cta" onClick={onClose}>
                          Got it, thanks!
                        </Button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
