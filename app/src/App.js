import React, { useState } from 'react'
import { useAppState, useAragonApi } from '@aragon/api-react'
import {
  Box,
  Button,
  GU,
  Header,
  IconAdd,
  IconEthereum,
  IconMinus,
  IconPlus,
  Main,
  Split,
  SyncIndicator,
  Tabs,
  Text,
  textStyle,
  TokenBadge,
} from '@aragon/ui'
import styled from 'styled-components'

import Accordion from "@aragon/ui/dist/Accordion"
import Field from "@aragon/ui/dist/Field"
import DataView from "@aragon/ui/dist/DataView"
import TableHeader from "@aragon/ui/dist/TableHeader"
import TableCell from "@aragon/ui/dist/TableCell"
import Table from "@aragon/ui/dist/Table"
import TableRow from "@aragon/ui/dist/TableRow"
import EmptyStateCard from "@aragon/ui/dist/EmptyStateCard"
import { DiscordIcon } from "./DiscordIcon"
import Link from "@aragon/ui/dist/Link"
import IconToken from "@aragon/ui/dist/IconToken"
import TokenAmount from "@aragon/ui/dist/TokenAmount"
import EthIdenticon from "@aragon/ui/dist/EthIdenticon"
import Card from "@aragon/ui/dist/Card"
import { BigNumber } from "bignumber.js"
import { POAPIcon } from "./POAPIcon"
import TextInput from "@aragon/ui/dist/TextInput"
import DropDown from "@aragon/ui/dist/DropDown"
import Switch from "@aragon/ui/dist/Switch"
import Modal from "@aragon/ui/dist/Modal"
import { String } from "core-js"
import axios from 'axios'
import ToastHub, { Toast } from "@aragon/ui/dist/ToastHub"

function InviteChannel({ value }) {
  return <div css={`
    display: flex;
    align-items: center;
    gap: ${1 * GU}px;
    margin-bottom: ${5 * GU}px;
    width: 100%
  `}>
    <DiscordIcon size={24} />
    {value &&
      <Link href={value} css={`${textStyle("body4")}`}>{value}</Link> ||
      <span css={`${textStyle("body4")}`}>N/A</span>
    }
  </div>
}

function ERC721Requirement({ value: { address, key, value } }) {
  return <div css={`display: flex; align-items: center`}>
    <EthIdenticon address={address} />
    <div css={`display: flex; flex-direction: column; justify-content: space-between; align-items: flex-start; margin-left: ${1 * GU}px;`}>
      <span css={`${textStyle("body3")}`}>{key}</span>
      <span css={`${textStyle("label3")}`}>{value}</span>
    </div>
  </div>
}

function POAPRequirement({ value }) {
  return <div css={`display: flex; align-items: center; gap: ${1 * GU}px;`}>
    <POAPIcon size={24} />
    <span css={`${textStyle("body2")}`}>{value}</span>
  </div>
}

function Requirement({ value: { type, address, key, value } }) {
  return <div>
    {type == "ETHER" && <TokenAmount
      amount={new BigNumber(value).times("1e18").toString()}
      address={"0x0000000000000000000000000000000000000000"}
      decimals={18}
    />}
    {type == "ERC20" && <TokenAmount
      amount={new BigNumber(value).times("1e18").toString()}
      address={address}
      decimals={18}
    />}
    {type.split(" ")[0] == "ERC721" && <ERC721Requirement value={{ address, key, value }} />}
    {type == "POAP" && <POAPRequirement value={value} />}
  </div>
}

function App() {
  const { api, appState } = useAragonApi()
  const { channels, isSyncing } = appState

  const [pageIndex, setTab] = useState(0)
  const [isCreating, setIsCreating] = useState(false)
  const [createRequirements, setCreateRequirements] = useState({})
  const [newRequirement, setNewRequirement] = useState({ type: null, address: null, key: null, value: null })
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [discordServerId, setDiscordServerId] = useState('')
  const [inviteChannel, setInviteChannel] = useState('')
  const [strict, setStrict] = useState(false)
  const requirementTypes = ["ETH", "ERC20", "ERC721", "POAP"]

  async function summon(signature, toast) {
    const params = { name, requirements: Object.values(createRequirements), addressSignedMessage: signature, logic: strict ? 'AND' : "OR" }
    if (discordServerId) params.discordServerId = discordServerId
    if (inviteChannel) params.inviteChannel = inviteChannel

    const response = await axios.post(`https://api.guild.xyz/summon`, params, { headers: { Authorization: 'alpha:6QwMyTrbjyBDvCZ4ReNVkuzxh3dRCHs9' } }).catch(e => e.response)

    const json = JSON.parse(response.data?.json ?? null)
    if (!json) throw "Invalid response."
    if (json.errors?.length) return toast("Error: " + json.errors[0].msg)

    const result = await api.summon(name, strict, discordServerId, inviteChannel, JSON.stringify(createRequirements)).toPromise()

    toast(response.status + ': ' + JSON.stringify(response.data))

    setIsCreating(false)
  }

  const add = () => {
    if (!newRequirement.type || !newRequirement.value) {
      return false
    }
    setCreateRequirements({ ...createRequirements, [String(Math.random()).split('.')[1]]: newRequirement })

    return true
  }
  return (
    <Main>
      <ToastHub>
        <Toast>
          {toast => (<>
            {isSyncing && <SyncIndicator />}
            <Header
              primary="guild.xyz"
            />
            <Tabs
              items={['Channels', 'Create']}
              selected={pageIndex}
              onChange={index => setTab(index)}
            />
            <Box
              css={`
          display: flex;
          justify-content: center;
          text-align: center;
          ${textStyle('title3')};
        `}
            >
              {pageIndex == 0 && <>
                {(!channels || !Object.keys(channels).length) && <EmptyStateCard text={"No channels added yet."} />}
                {channels && !!Object.keys(channels).length &&
                  Object.entries(channels ?? {})
                    .map(([id, channel]) =>
                      <Box key={"channel" + id} padding={3 * GU} css={`display: flex; justify-content: stretch; flex: 1`} >
                        <div css={`${textStyle("body2")} margin-bottom: ${3 * GU}px;`}>
                          {channel.name}
                        </div>
                        <InviteChannel value={channel.inviteChannel} />
                        <Field css={`
              `} label={
                            <div css={`${textStyle("label2")}; margin-bottom: ${3 * GU}px;`}>
                              Requirements ({channel.strict ? "ALL" : "Any"})
                            </div>
                          }>
                          {channel.requirements?.map((req, index) => <div key={'requirement' + index} css={`margin-bottom: ${2 * GU}px; margin-left: ${1 * GU}px;`}>
                            <Requirement value={req} />
                          </div>)}
                        </Field>
                      </Box>
                    )}
              </>}
              {pageIndex == 1 && <Box css={`display: flex; flex-direction: column; align-items: stretch; width: 100%`}>
                <div css={`${textStyle("body1")}; margin-bottom: ${3 * GU}px; margin-top: ${2 * GU}px;`}>Create a Channel</div>
                <Field label="Name" required>
                  <TextInput wide onChange={(ev) => setName(ev.target.value)} />
                </Field>
                <Field label="Discord Server ID">
                  <TextInput wide onChange={(ev) => setDiscordServerId(ev.target.value)} />
                </Field>
                <Field label="Invite Channel">
                  <TextInput wide onChange={(ev) => setInviteChannel(ev.target.value)} />

                </Field>
                <Field label="Requirements">
                  <div css={`display: flex; flex-direction: column; align-items: stretch; gap: ${2 * GU}px; padding-top: ${1 * GU}px;`}>
                    <div css={`display: flex; align-items: center; gap: ${1 * GU}px;`}><span css={`${textStyle("body3")}`}>Any</span><Switch checked={strict} onChange={(val) => setStrict(val)} /><span css={`${textStyle("body3")}`}>All</span></div>
                    <Button label="New" size="small" onClick={() => setShowModal(true)} wide />
                    <div css={`margin-left: ${2 * GU}px`}>
                      {Object.values(createRequirements).map((requirement, index) =>
                        <Requirement value={requirement} key={"req" + index} />)}
                      <div css={`display: flex; align-items: center; justify-content: space-between; margin-bottom: ${1 * GU}px;`}>
                      </div>
                    </div>
                  </div>
                </Field>
                <Button onClick={() => {
                  setIsCreating(true)
                  api.requestSignMessage("Please sign this message to verify your address",).subscribe((signature) => { summon(signature, toast) }, err =>
                    toast("Signature failed."))
                }}
                  label="Create" mode="strong" wide disabled={isCreating || !Object.entries(createRequirements).length || !name} />
              </Box>}
              <Modal visible={showModal} onClosed={() => setShowModal(false)} closeButton={true}>
                <Field label="Type">
                  <DropDown items={requirementTypes} selected={requirementTypes.findIndex((val) => val == newRequirement.type)} onChange={(val) => setNewRequirement({ type: requirementTypes[val] })} />
                </Field>
                {newRequirement.type && newRequirement.type != "POAP" && newRequirement.type != "ETH" && <Field label="Address">
                  <TextInput placeholder="0xa123..789" onChange={(ev) => setNewRequirement({ ...newRequirement, address: ev.target.value })} />
                </Field>}
                {newRequirement.type == "ERC721" && <Field label="Property">
                  <TextInput placeholder="Color" onChange={(ev) => setNewRequirement({ ...newRequirement, key: ev.target.value })} />
                </Field>}
                <Field label="Value"><TextInput placeholder="Value" onChange={(ev) => setNewRequirement({ ...newRequirement, value: ev.target.value })} /></Field>
                <Button onClick={() => { add() && setShowModal(false) }} label="Done"
                  disabled={!newRequirement.value || !newRequirement.type}
                />
              </Modal>
              {/* <Buttons>
          <Button
            display="icon"
            icon={<IconMinus />}
            label="Decrement"
            onClick={() => api.decrement(1).toPromise()}
          />
          <Button
            display="icon"
            icon={<IconPlus />}
            label="Increment"
            onClick={() => api.increment(1).toPromise()}
            css={`
              margin-left: ${2 * GU}px;
            `}
          />
        </Buttons> */}
            </Box>
          </>)}
        </Toast>
      </ToastHub>
    </Main>
  )
}


export default App
