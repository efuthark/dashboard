/* Copyright (c) 2022, VRAI Labs and/or its affiliates. All rights reserved.
 *
 * This software is licensed under the Apache License, Version 2.0 (the
 * "License") as published by the Apache Software Foundation.
 *
 * You may not use this file except in compliance with the License. You may
 * obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */

import React from 'react'

import { formatLongDate, getImageUrl, formatNumber } from '../../../utils'
import { UserRecipeType, UserWithRecipeId } from '../../pages/usersList/types'
import PhoneDisplay from '../phoneNumber/PhoneNumber'
import './UsersListTable.scss'

const USER_TABLE_COLUMNS_COUNT = 3
export const LIST_DEFAULT_LIMIT = 10
type UserListProps = {
  users: UserWithRecipeId[]
  count: number
  nextPaginationToken?: string
  isLoading?: boolean
  limit?: number
  offset?: number
  errorOffsets?: number[]
  goToNext?: (token: string) => any
  offsetChange?: (offset: number) => any
}

const UsersListTable: React.FC<UserListProps> = (props) => {
  const { users, limit, offset, isLoading, errorOffsets } = {
    offset: 0,
    limit: LIST_DEFAULT_LIMIT,
    ...props,
  }
  const displayedUsers = users.slice(offset, offset + limit)

  return (
    <div className='users-list-table-container'>
      <table className='users-list-table'>
        <thead>
          <tr>
            <th>User</th>
            <th>Auth Method</th>
            <th>Time joined</th>
          </tr>
        </thead>
        <tbody className='text-small'>
          {isLoading && (
            <PlaceholderTableRows rowCount={limit} colSpan={USER_TABLE_COLUMNS_COUNT} className={'user-info'} /> // show placeholder when it is loading from API
          )}
          {!isLoading &&
            (errorOffsets?.includes(offset) ? (
              <ErrorRow colSpan={USER_TABLE_COLUMNS_COUNT} /> // show rows when it is not loading from API
            ) : (
              <UserTableRows displayedUsers={displayedUsers} />
            ))}
        </tbody>
      </table>

      <div className='user-list-footer'>
        <UserListPagination {...props} offset={offset} limit={limit} />
      </div>
    </div>
  )
}

// Table Rows Section
const UserTableRows = ({ displayedUsers }: { displayedUsers: UserWithRecipeId[] }) => {
  return (
    <>
      {displayedUsers.map((user, index) => (
        <UserTableRow user={user} key={index} />
      ))}
    </>
  )
}

// Single Row Section
const UserTableRow: React.FC<{ user: UserWithRecipeId; index?: number }> = (props) => {
  const { user, index } = props
  return (
    <tr key={index} className='user-row'>
      <td>
        <UserInfo user={user} />
      </td>
      <td>
        <UserRecipePill user={user} />
      </td>
      <td>
        <UserDate user={user} />
      </td>
    </tr>
  )
}

const UserInfo = ({ user }: { user: UserWithRecipeId }) => {
  const { firstName, lastName, email } = user.user
  const phone = user.recipeId === 'passwordless' ? user.user.phoneNumber : undefined
  const name = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  return (
    <div className='user-info'>
      <div className='main' title={name || email}>
        {name || email || (phone && <PhoneDisplay phone={phone} />)}
      </div>
      {email && name && (
        <div className='email' title={email}>
          {email}
        </div>
      )}
      {phone && (name || email) && (
        <div className='phone'>
          <PhoneDisplay phone={phone} />
        </div>
      )}
    </div>
  )
}

const UserRecipePill = ({ user }: { user: UserWithRecipeId }) => {
  const thirdpartyId = user.recipeId === 'thirdparty' && user.user.thirdParty.id
  return (
    <div className={`pill ${user.recipeId} ${thirdpartyId}`}>
      <span>{UserRecipeTypeText[user.recipeId]}</span>
      {thirdpartyId && (
        <span className='thirdparty-name' title={thirdpartyId}>
          {' '}
          - {thirdpartyId}
        </span>
      )}
    </div>
  )
}

const UserDate = ({ user }: { user: UserWithRecipeId }) => {
  return <div className='user-date'>{user.user.timeJoined && formatLongDate(user.user.timeJoined)}</div>
}

const UserRecipeTypeText: Record<UserRecipeType, string> = {
  [`emailpassword`]: 'Email password',
  [`passwordless`]: 'Passwordless',
  [`thirdparty`]: 'Third party',
}

// Pagination Section
const UserListPagination = (props: UserListProps) => {
  const estimatedCount = getEstimatedCount(props)
  return (
    <div className='users-list-pagination'>
      {estimatedCount > 0 && <UserTablePaginationInfo {...props} count={estimatedCount} />}
      {estimatedCount > (props.limit ?? LIST_DEFAULT_LIMIT) && (
        <UserTablePaginationNavigation {...props} count={estimatedCount} />
      )}
    </div>
  )
}

const UserTablePaginationInfo = (props: Pick<UserListProps, 'count' | 'limit' | 'offset' | 'users'>) => {
  const { offset, limit, count, users } = { offset: 0, limit: LIST_DEFAULT_LIMIT, ...props }
  const displayedLength = users.slice(offset, offset + limit).length
  return (
    <p className='users-list-pagination-count text-small'>
      {formatNumber(offset + 1)} - {formatNumber(Math.min(offset + displayedLength, count))} of {formatNumber(count)}
    </p>
  )
}

const UserTablePaginationNavigation = (props: UserListProps) => {
  const { offset, limit, count, isLoading, offsetChange, nextPaginationToken, users, goToNext } = {
    offset: 0,
    limit: LIST_DEFAULT_LIMIT,
    ...props,
  }
  const handleNextPagination = () => {
    return () => {
      // go to some offset if the next page's records is already exist in memory
      if (offset + limit < users.length) {
        offsetChange && offsetChange(offset + limit)
      } else {
        // load next page from API if it has nextPaginationToken
        goToNext && nextPaginationToken && goToNext(nextPaginationToken)
      }
    }
  }

  return (
    <div className='users-list-pagination-navigation'>
      <button
        className='users-list-pagination-button'
        disabled={!offset || isLoading}
        onClick={() => offsetChange && offsetChange(Math.max(offset - limit, 0))}>
        <img src={getImageUrl('chevron-left.svg')} alt='Previous page' />
      </button>
      <button
        className='users-list-pagination-button'
        disabled={
          (!nextPaginationToken && offset + limit >= count) ||
          isLoading ||
          users.slice(offset, offset + limit).length === 0
        }
        onClick={handleNextPagination()}>
        <img src={getImageUrl('chevron-right.svg')} alt='Next page' />
      </button>
    </div>
  )
}

const ErrorRow = ({ colSpan }: { colSpan: number }) => {
  return (
    <tr className='empty-row'>
      <td colSpan={colSpan}>
        <div className='block-medium block-error'>
          <p className='text-bold'>Server Error:</p>
          <p>Failed to load user list. Please refresh to try again.</p>
        </div>
      </td>
    </tr>
  )
}

const PlaceholderTableRows = (props: { rowCount: number; colSpan: number; className?: string }) => {
  const { colSpan, rowCount, className } = props
  return (
    <>
      {new Array(rowCount).fill(undefined).map((_, index) => (
        <tr key={index} className='user-row placeholder'>
          <td colSpan={colSpan}>
            <div className={className}></div>
          </td>
        </tr>
      ))}
    </>
  )
}

/**
 * get estimated count as a fallback if the count API don't give correct value
 */
const getEstimatedCount = (props: Pick<UserListProps, 'count' | 'limit' | 'users' | 'nextPaginationToken'>) => {
  const { count, limit, users, nextPaginationToken } = {
    limit: LIST_DEFAULT_LIMIT,
    ...props,
  }
  // in case the count is smaller than user's length, then estimate the count to be users.length + limit
  return nextPaginationToken && count <= users.length ? users.length + limit : count
}

export default UsersListTable