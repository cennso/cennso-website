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
import { Tooltip } from '@material-tailwind/react/components/Tooltip'

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
  return (
    <div className="flex flex-row items-center gap-4">
      <ul className="flex flex-row items-center justify-center gap-2">
        <li className="flex flex-row items-center">
          <Tooltip
            placement="bottom"
            content="Share by email"
            className="bg-primary-600 text-xs"
          >
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
          </Tooltip>
        </li>
        <li className="flex flex-row items-center">
          <Tooltip
            placement="bottom"
            content="Share in Facebook"
            className="bg-primary-600 text-xs"
          >
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
          </Tooltip>
        </li>
        <li className="flex flex-row items-center">
          <Tooltip
            placement="bottom"
            content="Share in LinkedIn"
            className="bg-primary-600 text-xs"
          >
            <LinkedinShareButton
              url={currentPath}
              aria-label="Share this post on LinkedIn"
            >
              <Hexagon gradient={true}>
                <LinkedinIcon size={32} />
              </Hexagon>
            </LinkedinShareButton>
          </Tooltip>
        </li>
        <li className="flex flex-row items-center">
          <Tooltip
            placement="bottom"
            content="Share in Reddit"
            className="bg-primary-600 text-xs"
          >
            <RedditShareButton
              url={currentPath}
              title={title}
              aria-label="Share this post on Reddit"
            >
              <Hexagon gradient={true}>
                <RedditIcon size={32} />
              </Hexagon>
            </RedditShareButton>
          </Tooltip>
        </li>
        <li className="flex flex-row items-center">
          <Tooltip
            placement="bottom"
            content="Share in X"
            className="bg-primary-600 text-xs"
          >
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
          </Tooltip>
        </li>
      </ul>
    </div>
  )
}
