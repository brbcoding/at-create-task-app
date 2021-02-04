import {
  Box,
  Button,
  FieldPickerSynced,
  Heading,
  Input,
  Link,
  Text,
  TablePickerSynced,
  RecordCardList,
  Select,
  SwitchSynced,
  initializeBlock,
  useBase,
  useGlobalConfig,
  useLoadable,
  useSettingsButton,
  useWatchable,
  useRecordById,
  useRecords,
  FormField,
} from "@airtable/blocks/ui"
import { cursor } from "@airtable/blocks"
import React, { useEffect, useState } from "react"
import CreateTasksComponent from "./CreateTasksComponent"

// TODO: add the ability to see what tasks will be created before creating them
// TODO: confirm delete before deleting tasks
// TODO: due date logic
const SettingsComponent = ({
  projectsTable,
  tasksTable,
  templatesTable,
  requestsEnabled,
  requestsTable,
}) => {
  return (
    <Box padding={4}>
      <Heading marginLeft={2}>Settings</Heading>
      <Heading size="xsmall">Projects Table Setup</Heading>
      <FormField label="Projects / Deliverables Table">
        <TablePickerSynced globalConfigKey="projectsTableId" />
      </FormField>
      <FormField label="Projects <-> Tasks Linking Field">
        <FieldPickerSynced
          globalConfigKey="projectTasksFieldId"
          table={projectsTable}
        />
      </FormField>
      {/* can we get the id of the linked table from table.fields? */}
      {projectsTable && (
        <>
          <FormField label="Project Due Date / Deadline Field">
            <FieldPickerSynced
              globalConfigKey="projectDueDateFieldId"
              table={projectsTable}
            />
          </FormField>
          <FormField label="Projects <-> Project Types Linking Field">
            <FieldPickerSynced
              globalConfigKey="projectTypesFieldId"
              table={projectsTable}
            />
          </FormField>
          <FormField label="Projects Name Field">
            <FieldPickerSynced
              globalConfigKey="projectNameFieldId"
              table={projectsTable}
            />
          </FormField>

          {requestsEnabled && (
            <FormField label="Projects <-> Requests Linking Field">
              <FieldPickerSynced
                globalConfigKey="projectRequestsFieldId"
                table={projectsTable}
              />
            </FormField>
          )}
        </>
      )}
      <Heading size="xsmall">Tasks Table Setup</Heading>
      <FormField label="Tasks Table">
        <TablePickerSynced globalConfigKey="tasksTableId" />
      </FormField>
      {tasksTable && (
        <>
          <FormField label="Task Name Field">
            <FieldPickerSynced
              globalConfigKey="tasksNameFieldId"
              table={tasksTable}
            />
          </FormField>
          <FormField label="Tasks field to use as task order">
            <FieldPickerSynced
              globalConfigKey="tasksOrderFieldId"
              table={tasksTable}
            />
          </FormField>
          <FormField label="Tasks due date / deadline Field">
            <FieldPickerSynced
              globalConfigKey="tasksDueDateFieldId"
              table={tasksTable}
            />
          </FormField>
          <FormField label="Tasks duration field">
            <FieldPickerSynced
              globalConfigKey="tasksDurationFieldId"
              table={tasksTable}
            />
          </FormField>
          <FormField label="Tasks dependency field">
            <FieldPickerSynced
              globalConfigKey="tasksDependencyFieldId"
              table={tasksTable}
            />
          </FormField>
          <FormField label="Tasks driver field">
            <FieldPickerSynced
              globalConfigKey="tasksDriverFieldId"
              table={tasksTable}
            />
          </FormField>
          <FormField label="Tasks status field">
            <FieldPickerSynced
              globalConfigKey="tasksStatusFieldId"
              table={tasksTable}
            />
          </FormField>
          <FormField label="Tasks <-> Project Linking Field">
            <FieldPickerSynced
              globalConfigKey="tasksProjectFieldId"
              table={tasksTable}
            />
          </FormField>
        </>
      )}
      <Heading size="xsmall">Template Table Setup</Heading>
      <FormField label="Task Template Table">
        <TablePickerSynced globalConfigKey="templateTableId" />
      </FormField>
      {/* can we get the id of the linked table from table.fields? */}
      {templatesTable && (
        <>
          <FormField label="Template field to use as task name">
            <FieldPickerSynced
              globalConfigKey="templateStepNameFieldId"
              table={templatesTable}
            />
          </FormField>
          <FormField label="Template field to use as task order">
            <FieldPickerSynced
              globalConfigKey="templateStepOrderFieldId"
              table={templatesTable}
            />
          </FormField>
          <FormField label="Template duration field">
            <FieldPickerSynced
              globalConfigKey="templateDurationFieldId"
              table={templatesTable}
            />
          </FormField>
          <FormField label="Template dependency field">
            <FieldPickerSynced
              globalConfigKey="templateDependencyFieldId"
              table={templatesTable}
            />
          </FormField>
          <FormField label="Template driver field">
            <FieldPickerSynced
              globalConfigKey="templateDriverFieldId"
              table={templatesTable}
            />
          </FormField>
          <FormField label="Templates <-> Template Types Linking Field">
            <FieldPickerSynced
              globalConfigKey="templateTypeFieldId"
              table={templatesTable}
            />
          </FormField>
        </>
      )}
      <Box display="flex" flexDirection="column">
        <Heading size="xsmall">Requests Table Setup</Heading>
        <SwitchSynced
          label="Enable Requests Table?"
          globalConfigKey="requestsEnabled"
          backgroundColor="transparent"
          padding="0"
          marginY="0"
        />
        {requestsEnabled && (
          <>
            <FormField label="Requests Table">
              <TablePickerSynced globalConfigKey="requestsTableId" />
            </FormField>
            <FormField label="Project Type Table">
              <TablePickerSynced globalConfigKey="projectTypesTableId" />
            </FormField>
            <FormField label="Request Name Field">
              <FieldPickerSynced
                globalConfigKey="requestNameFieldId"
                table={requestsTable}
              />
            </FormField>
            <FormField label="Request Due Date Field">
              <FieldPickerSynced
                globalConfigKey="requestDueDateFieldId"
                table={requestsTable}
              />
            </FormField>
          </>
        )}
      </Box>
    </Box>
  )
}

function AirTasks() {
  const [isShowingSettings, setIsShowingSettings] = useState(false)
  const [newProjectType, setNewProjectType] = useState("")
  const [newProjectName, setNewProjectName] = useState("")
  const globalConfig = useGlobalConfig()
  const base = useBase()
  const projectsTableId = globalConfig.get("projectsTableId")
  const projectDueDateFieldId = globalConfig.get("projectDueDateFieldId")
  const projectTypesFieldId = globalConfig.get("projectTypesFieldId")
  const projectTypesTableId = globalConfig.get("projectTypesTableId")
  const projectRequestsFieldId = globalConfig.get("projectRequestsFieldId")
  const projectNameFieldId = globalConfig.get("projectNameFieldId")
  const projectTasksFieldId = globalConfig.get("projectTasksFieldId")

  const tasksTableId = globalConfig.get("tasksTableId")

  const templateTableId = globalConfig.get("templateTableId")

  const tasksProjectFieldId = globalConfig.get("tasksProjectFieldId")
  const tasksNameFieldId = globalConfig.get("tasksNameFieldId")
  const tasksOrderFieldId = globalConfig.get("tasksOrderFieldId")
  const tasksDueDateFieldId = globalConfig.get("tasksDueDateFieldId")
  const tasksDurationFieldId = globalConfig.get("tasksDurationFieldId")
  const tasksDependencyFieldId = globalConfig.get("tasksDependencyFieldId")
  const tasksDriverFieldId = globalConfig.get("tasksDriverFieldId")
  const tasksStatusFieldId = globalConfig.get("tasksStatusFieldId")

  const requestsEnabled = globalConfig.get("requestsEnabled")
  const requestsTableId = globalConfig.get("requestsTableId")
  const requestDueDateFieldId = globalConfig.get("requestDueDateFieldId")

  const projectsTable = base.getTableByIdIfExists(projectsTableId)
  const templatesTable = base.getTableByIdIfExists(templateTableId)
  const tasksTable = base.getTableByIdIfExists(tasksTableId)
  const requestsTable =
    requestsEnabled && base.getTableByIdIfExists(requestsTableId)

  const projectTypesTable = base.getTableByIdIfExists(projectTypesTableId)
  const projectsTableSelected = cursor.activeTableId === projectsTableId
  const requestsTableSelected = cursor.activeTableId === requestsTableId

  useSettingsButton(() => {
    setIsShowingSettings(!isShowingSettings)
  })

  useLoadable(cursor)
  useWatchable(cursor, ["selectedRecordIds", "activeTableId"])

  const requestsRecord = useRecordById(
    requestsTable,
    cursor.selectedRecordIds.length ? cursor.selectedRecordIds[0] : ""
  )

  const projectTypesRecords = useRecords(projectTypesTable)

  const [dueDate, setDueDate] = useState(
    requestsRecord ? requestsRecord.getCellValue(requestDueDateFieldId) : ""
  )

  const [selectedProject, setSelectedProject] = useState(
    projectsTableSelected && cursor.selectedRecordIds.length
      ? cursor.selectedRecordIds[0]
      : ""
  )

  const [selectedRequest, setSelectedRequest] = useState(
    requestsTableSelected && cursor.selectedRecordIds.length
      ? cursor.selectedRecordIds[0]
      : ""
  )

  useWatchable(cursor, ["activeTableId"], () => {
    setSelectedProject("")
    setSelectedRequest("")
  })

  useWatchable(cursor, ["selectedRecordIds"], () => {
    if (projectsTableSelected && cursor.selectedRecordIds.length) {
      setSelectedProject(cursor.selectedRecordIds[0])
    }

    if (requestsTableSelected && cursor.selectedRecordIds.length) {
      setSelectedProject("")
      setSelectedRequest(cursor.selectedRecordIds[0])
    }
  })

  useEffect(() => {
    if (requestsRecord) {
      setDueDate(requestsRecord.getCellValue(requestDueDateFieldId))
    }
  }, [selectedRequest])

  const requiredSettings = [
    tasksProjectFieldId,
    tasksNameFieldId,
    tasksOrderFieldId,
    tasksDueDateFieldId,
    tasksDurationFieldId,
    tasksDependencyFieldId,
    tasksDriverFieldId,
    tasksStatusFieldId,
  ]

  if (requiredSettings.indexOf(undefined) > -1)
    return (
      <SettingsComponent
        projectsTable={projectsTable}
        templatesTable={templatesTable}
        tasksTable={tasksTable}
        requestsEnabled={requestsEnabled}
        requestsTable={requestsTable}
      />
    )

  const onSetDueDate = async (e) => {
    setDueDate(e.target.value)
  }

  const onSetProjectType = async (type) => {
    setNewProjectType(type)
  }

  const onSetProjectName = async (e) => {
    setNewProjectName(e.target.value)
  }

  const onLinkToProjectsTable = (e) => {
    e.preventDefault()
    cursor.setActiveTable(projectsTable)
  }

  const onLinkToRequestsTable = (e) => {
    e.preventDefault()
    cursor.setActiveTable(requestsTable)
  }

  const onCreateProject = async () => {
    const project = {
      [projectNameFieldId]: newProjectName,
      [projectRequestsFieldId]: [{ id: requestsRecord.id }],
      [projectDueDateFieldId]: dueDate,
      [projectTypesFieldId]: [{ id: newProjectType }],
    }

    const newProjectId = await projectsTable.createRecordAsync(project)
    setSelectedProject(newProjectId)
    setNewProjectName("")
    setNewProjectType("")
    setDueDate("")
  }

  if (isShowingSettings || !projectsTableId)
    return (
      <SettingsComponent
        projectsTable={projectsTable}
        templatesTable={templatesTable}
        tasksTable={tasksTable}
        requestsEnabled={requestsEnabled}
        requestsTable={requestsTable}
      />
    )

  if (
    cursor.activeTableId !== projectsTableId &&
    cursor.activeTableId !== requestsTableId
  ) {
    return (
      <Box padding={2} display="flex">
        <Text as="span">
          Select a record from the{" "}
          <Link
            href="/"
            style={{ cursor: "pointer" }}
            onClick={onLinkToProjectsTable}
          >
            {projectsTable.name}
          </Link>
          {requestsEnabled ? (
            <>
              <Text as="span"> or the </Text>
              <Link
                href="/"
                style={{ cursor: "pointer" }}
                onClick={onLinkToRequestsTable}
              >
                {requestsTable.name}
              </Link>{" "}
              <Text as="span"> table to create tasks.</Text>
            </>
          ) : (
            "."
          )}
        </Text>
      </Box>
    )
  }

  const projectTypesOptions = projectTypesRecords.map((type) => {
    return {
      value: type.id,
      label: type.name,
    }
  })

  return (
    <Box
      padding={2}
      width="100%"
      display="flex"
      flexDirection="column"
      marginY={2}
    >
      {projectsTableSelected ? (
        <CreateTasksComponent projectsRecordId={selectedProject} />
      ) : (
        <>
          <Heading>✨ Create {projectsTable.name} </Heading>
          {cursor.selectedRecordIds.length ? (
            <Box>
              <RecordCardList records={[requestsRecord]} height={100} />
              <Box padding={2}>
                <FormField label={`Name`}>
                  <Input
                    value={newProjectName}
                    onChange={onSetProjectName}
                  ></Input>
                </FormField>
                <FormField
                  label={`Type - note: this should be listed in your ${projectTypesTable.name} table`}
                >
                  <Select
                    options={projectTypesOptions}
                    value={newProjectType}
                    onChange={onSetProjectType}
                  />
                </FormField>
                <FormField label={`Due date`}>
                  <Input type="date" onChange={onSetDueDate} value={dueDate} />
                </FormField>
                <Button
                  onClick={onCreateProject}
                  variant="primary"
                  disabled={newProjectName === "" || newProjectType === ""}
                >
                  Create new {`${projectsTable.name}`}
                </Button>
              </Box>
            </Box>
          ) : (
            `Select a request to create a linked ${projectsTable.name} record.`
          )}
          {cursor.selectedRecordIds.length && selectedProject ? (
            <CreateTasksComponent projectsRecordId={selectedProject} />
          ) : (
            <></>
          )}
        </>
      )}
    </Box>
  )
}

initializeBlock(() => <AirTasks />)
