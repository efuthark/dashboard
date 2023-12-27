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

import { useContext, useState } from "react";
import { PasswordlessContactMethod } from "../../../api/tenants/login-methods";
import useCreateUserService, { CreatePasswordlessUserPayload } from "../../../api/user/create";
import { getApiUrl, getImageUrl } from "../../../utils";
import { PopupContentContext } from "../../contexts/PopupContentContext";
import Button from "../button";
import { Dialog, DialogContent, DialogFooter } from "../dialog";
import InputField from "../inputField/InputField";
import { PhoneNumberInput } from "../phoneNumber/PhoneNumberInput";
import { CreateUserDialogStepType } from "./CreateUserDialog";

type CreatePasswordlessUserProps = {
	tenantId: string;
	authMethod: PasswordlessContactMethod;
	onCloseDialog: () => void;
	setCurrentStep: (step: CreateUserDialogStepType) => void;
};

function isNumber(value: string): boolean {
	const trimmedString = value.replaceAll(/\s/g, "").trim();

	// added this check since parsing a empty string to a number returns 0.
	if (trimmedString.length < 1) {
		return false;
	}

	return isNaN(Number(trimmedString)) === false;
}

export default function CreatePasswordlessUser({
	tenantId,
	authMethod,
	onCloseDialog,
	setCurrentStep,
}: CreatePasswordlessUserProps) {
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [emailOrPhone, setEmailOrPhone] = useState("");

	const [generalErrorMessage, setGeneralErrorMessage] = useState<string | undefined>(undefined);

	const [isCreatingUser, setIsCreatingUser] = useState(false);
	const [isPhoneNumber, setIsPhoneNumber] = useState(false);
	const [isEmail, setIsEmail] = useState(false);

	const { createPasswordlessUser } = useCreateUserService();
	const { showToast } = useContext(PopupContentContext);

	async function createUser() {
		setIsCreatingUser(true);
		setGeneralErrorMessage(undefined);
		try {
			const payload: CreatePasswordlessUserPayload = {};

			// Note: We're intentionally skipping frontend input validation in favor of user defined custom validators running on the backend.

			if (authMethod === "EMAIL") {
				payload.email = email;
			} else if (authMethod === "PHONE") {
				payload.phoneNumber = phoneNumber;
			} else if (authMethod === "EMAIL_OR_PHONE") {
				if (isNumber(emailOrPhone) === true) {
					payload.phoneNumber = emailOrPhone;
					if (emailOrPhone.startsWith("+") === false) {
						setEmailOrPhone("+" + emailOrPhone);
					}
					setIsPhoneNumber(true);
				} else {
					payload.email = emailOrPhone;
					setIsEmail(true);
				}
			} else {
				showToast({
					iconImage: getImageUrl("form-field-error-icon.svg"),
					toastType: "error",
					children: <>No matching auth method found!</>,
				});
				return;
			}

			const response = await createPasswordlessUser(tenantId, payload);

			if (response.status === "EMAIL_VALIDATION_ERROR" || response.status === "PHONE_VALIDATION_ERROR") {
				setGeneralErrorMessage(response.message);
				return;
			}

			if (response.status === "OK") {
				if (response.createdNewRecipeUser === false) {
					let message = "";
					if (authMethod === "EMAIL") {
						message = "User with this email already exists!";
					} else if (authMethod === "PHONE") {
						message = "User with this phone number already exists!";
					} else {
						message = "User with these credentials already exists!";
					}
					showToast({
						iconImage: getImageUrl("form-field-error-icon.svg"),
						toastType: "error",
						children: <>{message}</>,
					});
				} else {
					showToast({
						iconImage: getImageUrl("checkmark-green.svg"),
						toastType: "success",
						children: <>User created successfully!</>,
					});
					window.open(getApiUrl(`?userid=${response.user.id}`), "_blank");
				}
			}
		} catch (_) {
			showToast({
				iconImage: getImageUrl("form-field-error-icon.svg"),
				toastType: "error",
				children: <>Something went wrong, please try again!</>,
			});
		} finally {
			setIsCreatingUser(false);
		}
	}

	return (
		<Dialog
			className="max-width-436"
			title="User Info"
			onCloseDialog={onCloseDialog}>
			<DialogContent className="text-small text-semi-bold">
				<div className="dialog-form-content-container">
					{authMethod === "EMAIL" && (
						<InputField
							error={generalErrorMessage}
							label="Email"
							hideColon
							value={email}
							handleChange={(e) => {
								setGeneralErrorMessage(undefined);
								setEmail(e.currentTarget.value);
							}}
							name="email"
							type="email"
						/>
					)}
					{authMethod === "PHONE" && (
						<PhoneNumberInput
							error={generalErrorMessage}
							name="phone"
							onChange={(phNumber) => {
								setGeneralErrorMessage(undefined);
								setPhoneNumber(phNumber);
							}}
							label="Phone Number"
							hideColon
						/>
					)}
					{authMethod === "EMAIL_OR_PHONE" && (
						<>
							{isPhoneNumber ? (
								<PhoneNumberInput
									error={generalErrorMessage}
									value={emailOrPhone}
									name="phone"
									onChange={(phNumber) => {
										setGeneralErrorMessage(undefined);
										setEmailOrPhone(phNumber);
									}}
									label="Phone Number"
									forceShowError
									hideColon
								/>
							) : (
								<InputField
									error={generalErrorMessage}
									label={isEmail ? "Email" : "Email or Phone"}
									hideColon
									value={emailOrPhone}
									handleChange={(e) => {
										setGeneralErrorMessage(undefined);
										setEmailOrPhone(e.currentTarget.value);
									}}
									name="emailOrPhone"
									type="text"
								/>
							)}
						</>
					)}
				</div>
				<DialogFooter border="border-top">
					<Button
						color="gray-outline"
						onClick={() => {
							setCurrentStep("select-auth-method-and-tenant");
						}}>
						Go Back
					</Button>
					<Button
						onClick={createUser}
						isLoading={isCreatingUser}
						disabled={isCreatingUser}>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
