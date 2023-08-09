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
import { PropsWithChildren, createContext, useContext } from "react";
import { User } from "../../../pages/usersList/types";
import UserDetail from "../userDetail";

type UserDetailContextType = {
	showLoadingOverlay: () => void;
	hideLoadingOverlay: () => void;
	userDetail: UserDetails;
};

type IncomingProps = {
	showLoadingOverlay: () => void;
	hideLoadingOverlay: () => void;
	userDetail: UserDetails;
};

export type UserDetails = {
	userId: string;
	details: User;
	emailVerified: boolean;
	metaData: string | undefined;
	sessions: { sessionHandle: string; timeCreated: number; expiry: number }[] | undefined;
	func: {
		refetchAllData: () => Promise<void>;
		updateUser: (userId: string, data: User) => Promise<{ status: string; error?: string }>;
	};
};

type Props = PropsWithChildren<IncomingProps>;

const UserDetailContext = createContext<UserDetailContextType | undefined>(undefined);

export const useUserDetailContext = () => {
	const context = useContext(UserDetailContext);
	if (!context) throw "Context must be used within a provider!";
	return context;
};

export const UserDetailContextProvider: React.FC<Props> = (props: Props) => {
	return (
		<UserDetailContext.Provider
			value={{
				showLoadingOverlay: props.showLoadingOverlay,
				hideLoadingOverlay: props.hideLoadingOverlay,
				userDetail: props.userDetail,
			}}>
			{props.children}
		</UserDetailContext.Provider>
	);
};
