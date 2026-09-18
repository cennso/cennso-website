import {
  EmailShareButton,
  EmailIcon,
  FacebookShareButton,
  FacebookIcon,
  LinkedinShareButton,
  LinkedinIcon,
  RedditShareButton,
  RedditIcon,
  TwitterShareButton,
  TwitterIcon,
} from 'next-share'
import { Tooltip, TooltipProvider } from '@cennso/ui'

import { Hexagon } from '../common'

import type { FunctionComponent } from 'react'

interface ShareProps {
  title: string
  currentPath: string
}

export const Share: FunctionComponent<ShareProps> = ({
  title,
  currentPath,
}) => {
  // The provider lives here, not in _app, because Share is the only Tooltip
  // consumer in the repository and it renders on two routes. Mounting it globally
  // pulled Base UI's tooltip machinery into the shared chunk for every page.
  // One provider wrapping all five still gives them the shared open/close delay
  // that makes a row of adjacent tooltips behave as one control.
  return (
    <TooltipProvider>
      <div className="flex flex-row items-center gap-4">
        <ul className="flex flex-row items-center justify-center gap-2">
          <li className="flex flex-row items-center">
            <Tooltip>
              <Tooltip.Trigger render={<span className="inline-flex" />}>
                <EmailShareButton
                  url={currentPath}
                  subject="Check blog post from Cennso"
                  body={title}
                  aria-label="Share this post by email"
                >
                  <Hexagon gradient={true}>
                    <EmailIcon size={32} />
                  </Hexagon>
                </EmailShareButton>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">Share by email</Tooltip.Content>
            </Tooltip>
          </li>
          <li className="flex flex-row items-center">
            <Tooltip>
              <Tooltip.Trigger render={<span className="inline-flex" />}>
                <FacebookShareButton
                  url={currentPath}
                  quote={title}
                  hashtag={'#cennso'}
                  aria-label="Share this post on Facebook"
                >
                  <Hexagon gradient={true}>
                    <FacebookIcon size={32} />
                  </Hexagon>
                </FacebookShareButton>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">Share in Facebook</Tooltip.Content>
            </Tooltip>
          </li>
          <li className="flex flex-row items-center">
            <Tooltip>
              <Tooltip.Trigger render={<span className="inline-flex" />}>
                <LinkedinShareButton
                  url={currentPath}
                  aria-label="Share this post on LinkedIn"
                >
                  <Hexagon gradient={true}>
                    <LinkedinIcon size={32} />
                  </Hexagon>
                </LinkedinShareButton>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">Share in LinkedIn</Tooltip.Content>
            </Tooltip>
          </li>
          <li className="flex flex-row items-center">
            <Tooltip>
              <Tooltip.Trigger render={<span className="inline-flex" />}>
                <RedditShareButton
                  url={currentPath}
                  title={title}
                  aria-label="Share this post on Reddit"
                >
                  <Hexagon gradient={true}>
                    <RedditIcon size={32} />
                  </Hexagon>
                </RedditShareButton>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">Share in Reddit</Tooltip.Content>
            </Tooltip>
          </li>
          <li className="flex flex-row items-center">
            <Tooltip>
              <Tooltip.Trigger render={<span className="inline-flex" />}>
                <TwitterShareButton
                  url={currentPath}
                  title={title}
                  hashtags={['cennso']}
                  aria-label="Share this post on X (formerly Twitter)"
                >
                  <Hexagon gradient={true}>
                    <TwitterIcon size={32} />
                  </Hexagon>
                </TwitterShareButton>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom">Share in X</Tooltip.Content>
            </Tooltip>
          </li>
        </ul>
      </div>
    </TooltipProvider>
  )
}
