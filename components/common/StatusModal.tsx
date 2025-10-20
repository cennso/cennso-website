import { Fragment, useState, useCallback, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import { Button } from '../common'
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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-[32px] bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {action === 'sending' ? (
                    <div className="w-full h-full flex flex-row items-center justify-center">
                      <LoadingIndicator className="text-primary-600" />
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
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Sending {kind}{' '}
                        {action === 'success' ? 'successfully' : 'error'}
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          {action === 'success' ? (
                            <span>
                              Your {kind} has been successfully send. Please
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
                                className="text-primary-600 hover:text-primary-700 transition duration-300 ease-in-out"
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
                        <Button
                          type="button"
                          variant="primary"
                          onClick={onClose}
                          className="text-sm"
                        >
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
