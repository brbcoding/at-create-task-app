import {
  Box,
  Button,
  FieldPickerSynced,
  Heading,
  Link,
  Text,
  TablePickerSynced,
  RecordCard,
  RecordCardList,
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
import React, { useState } from "react"

const SettingsComponent = ({ projectsTable, tasksTable, templatesTable }) => {
  return (
    <Box padding={4}>
      <Heading>Settings</Heading>
      <Heading size="xsmall">Projects Table Setup</Heading>
      <FormField label="Projects / Deliverables Table">
        <TablePickerSynced globalConfigKey="projectsTableId" />
      </FormField>
      <FormField label="Projects <-> Tasks Linking Field">
        <FieldPickerSynced
          globalConfigKey="projectTasksField"
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
          <FormField label="Tasks <-> Project Linking Field">
            <FieldPickerSynced
              globalConfigKey="tasksProjectFieldId"
              table={tasksTable}
            />
          </FormField>
        </>
      )}
      <FormField label="Task Template Table">
        <TablePickerSynced globalConfigKey="templateTableId" />
      </FormField>
      {/* can we get the id of the linked table from table.fields? */}
      <Heading size="xsmall">Template Table Setup</Heading>
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
          <FormField label="Template dependency field id">
            <FieldPickerSynced
              globalConfigKey="templateDependencyFieldId"
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
    </Box>
  )
}

function AirTasks() {
  const [isShowingSettings, setIsShowingSettings] = useState(false)
  const globalConfig = useGlobalConfig()
  const base = useBase()
  const projectsTableId = globalConfig.get("projectsTableId")
  const projectDueDateFieldId = globalConfig.get("projectDueDateFieldId")
  const projectTypesFieldId = globalConfig.get("projectTypesFieldId")

  const tasksTableId = globalConfig.get("tasksTableId")

  const templateTableId = globalConfig.get("templateTableId")
  const templateTypeFieldId = globalConfig.get("templateTypeFieldId")
  const templateStepNameFieldId = globalConfig.get("templateStepNameFieldId")
  const templateStepOrderFieldId = globalConfig.get("templateStepOrderFieldId")
  const templateDurationFieldId = globalConfig.get("templateDurationFieldId")
  const templateDependencyFieldId = globalConfig.get(
    "templateDependencyFieldId"
  )

  const tasksProjectFieldId = globalConfig.get("tasksProjectFieldId")
  const tasksNameFieldId = globalConfig.get("tasksNameFieldId")
  const tasksOrderFieldId = globalConfig.get("tasksOrderFieldId")
  const tasksDueDateFieldId = globalConfig.get("tasksDueDateFieldId")
  const tasksDurationFieldId = globalConfig.get("tasksDurationFieldId")
  const tasksDependencyFieldId = globalConfig.get("tasksDependencyFieldId")

  const projectsTable = base.getTableByIdIfExists(projectsTableId)
  const templatesTable = base.getTableByIdIfExists(templateTableId)
  const tasksTable = base.getTableByIdIfExists(tasksTableId)

  useSettingsButton(() => {
    setIsShowingSettings(!isShowingSettings)
  })

  useLoadable(cursor)
  useWatchable(cursor, ["selectedRecordIds", "activeTableId"])

  const record = useRecordById(
    projectsTable,
    cursor.selectedRecordIds.length ? cursor.selectedRecordIds[0] : ""
  )

  const taskRecords = useRecords(tasksTable).filter(
    (taskRecord) =>
      record && taskRecord.getCellValue(tasksProjectFieldId)[0].id === record.id
  )

  const projectType = record ? record.getCellValue(projectTypesFieldId) : null

  const templateRecords = useRecords(templatesTable).filter(
    (templateRecord) => {
      const templateProjectType = templateRecord.getCellValue(
        templateTypeFieldId
      )
      if (
        projectType &&
        projectType.length &&
        templateProjectType &&
        templateProjectType.length
      ) {
        return projectType[0].id === templateProjectType[0].id
      }
    }
  )

  const templateDependencies = templateRecords
    ? templateRecords.map((templateRecord) => {
        const dependencies = templateRecord.getCellValue(
          templateDependencyFieldId
        )

        return {
          id: templateRecord.id,
          dependencies: dependencies
            ? dependencies.map((d) => {
                return templateRecords.findIndex(
                  (templateRecord) => templateRecord.id === d.id
                )
              })
            : [],
        }
      })
    : []

  const onCreateTasks = async () => {
    // use template records to create tasks
    const newTaskRecords = templateRecords.map((t) => ({
      fields: {
        [tasksNameFieldId]: t.getCellValue(templateStepNameFieldId),
        [tasksProjectFieldId]: [{ id: record.id }],
        [tasksOrderFieldId]: t.getCellValue(templateStepOrderFieldId),
        [tasksDurationFieldId]: t.getCellValue(templateDurationFieldId),
      },
    }))

    // TODO: make this work with more than 50 steps (batch requests)
    const newRecords = await tasksTable.createRecordsAsync(newTaskRecords)
    const recordUpdates = newRecords
      .map((recordId, idx) => {
        const deps = templateDependencies[idx].dependencies
        if (!deps.length) return

        return {
          id: recordId,
          fields: {
            [tasksDependencyFieldId]: templateDependencies[
              idx
            ].dependencies.map((dependencyIndex) => ({
              id: newRecords[dependencyIndex],
            })),
          },
        }
      })
      .filter((r) => r !== undefined)

    const dependencyUpdates = await tasksTable.updateRecordsAsync(recordUpdates)
  }

  const onLinkToProjectsTable = (e) => {
    e.preventDefault()
    cursor.setActiveTable(projectsTable)
  }

  if (isShowingSettings || !projectsTableId)
    return (
      <SettingsComponent
        projectsTable={projectsTable}
        templatesTable={templatesTable}
        tasksTable={tasksTable}
      />
    )

  if (cursor.activeTableId !== projectsTableId) {
    return (
      <Box padding={2}>
        <Text>
          Select a record from the{" "}
          <Link
            href="/"
            style={{ cursor: "pointer" }}
            onClick={onLinkToProjectsTable}
          >
            {projectsTable.name}
          </Link>{" "}
          table to create tasks.
        </Text>
      </Box>
    )
  }

  return (
    <Box padding={2} width="100%">
      <Heading>✨ Create Tasks from Template</Heading>
      {cursor.selectedRecordIds.length ? (
        <Box>
          <RecordCard record={record} />
          {taskRecords.length ? (
            <Box marginTop={2}>
              <Heading size="small">
                Existing Tasks [{taskRecords.length}]
              </Heading>
              {<RecordCardList records={taskRecords} height={300} />}
            </Box>
          ) : (
            <></>
          )}
          <Button onClick={onCreateTasks} marginTop={2}>
            {taskRecords.length ? "Create additional tasks" : "Create tasks"}
          </Button>
        </Box>
      ) : (
        "Select project to create tasks"
      )}
    </Box>
  )
}

initializeBlock(() => <AirTasks />)
