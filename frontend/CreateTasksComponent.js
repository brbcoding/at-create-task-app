import {
  Box,
  Button,
  Heading,
  Input,
  RecordCardList,
  useBase,
  useGlobalConfig,
  useLoadable,
  useWatchable,
  useRecordById,
  useRecords,
} from "@airtable/blocks/ui"
import { cursor } from "@airtable/blocks"
import React, { useEffect, useState } from "react"
import { DateTime } from "luxon"

function CreateTasksComponent({ projectsRecordId = "" }) {
  const globalConfig = useGlobalConfig()
  const base = useBase()
  const projectsTableId = globalConfig.get("projectsTableId")
  const projectDueDateFieldId = globalConfig.get("projectDueDateFieldId")
  const projectTypesFieldId = globalConfig.get("projectTypesFieldId")
  const projectTasksFieldId = globalConfig.get("projectTasksFieldId")

  const tasksTableId = globalConfig.get("tasksTableId")

  const templateTableId = globalConfig.get("templateTableId")
  const templateTypeFieldId = globalConfig.get("templateTypeFieldId")
  const templateStepNameFieldId = globalConfig.get("templateStepNameFieldId")
  const templateStepOrderFieldId = globalConfig.get("templateStepOrderFieldId")
  const templateDurationFieldId = globalConfig.get("templateDurationFieldId")
  const templateDependencyFieldId = globalConfig.get(
    "templateDependencyFieldId"
  )
  const templateDriverFieldId = globalConfig.get("templateDriverFieldId")

  const tasksProjectFieldId = globalConfig.get("tasksProjectFieldId")
  const tasksNameFieldId = globalConfig.get("tasksNameFieldId")
  const tasksOrderFieldId = globalConfig.get("tasksOrderFieldId")
  const tasksDueDateFieldId = globalConfig.get("tasksDueDateFieldId")
  const tasksDurationFieldId = globalConfig.get("tasksDurationFieldId")
  const tasksDependencyFieldId = globalConfig.get("tasksDependencyFieldId")
  const tasksDriverFieldId = globalConfig.get("tasksDriverFieldId")
  const tasksStatusFieldId = globalConfig.get("tasksStatusFieldId")

  const projectsTable = base.getTableByIdIfExists(projectsTableId)
  const templatesTable = base.getTableByIdIfExists(templateTableId)
  const tasksTable = base.getTableByIdIfExists(tasksTableId)

  useLoadable(cursor)
  useWatchable(cursor, ["selectedRecordIds", "activeTableId"])

  const projectsRecord = useRecordById(projectsTable, projectsRecordId)
  const [dueDate, setDueDate] = useState(
    (projectsRecord && projectsRecord.getCellValue(projectDueDateFieldId)) || ""
  )

  useEffect(() => {
    setDueDate(
      (projectsRecord && projectsRecord.getCellValue(projectDueDateFieldId)) ||
        ""
    )
  }, [projectsRecord])

  const tasks = useRecords(tasksTable)
  const taskRecords =
    !tasks || !tasks.length || !projectsRecord
      ? []
      : tasks.filter((taskRecord) => {
          const project = taskRecord.getCellValue(tasksProjectFieldId)
          return projectsRecord && project
            ? project[0].id === projectsRecord.id
            : null
        })

  const projectType = projectsRecord
    ? projectsRecord.getCellValue(projectTypesFieldId)
    : null

  const templatesRecords = useRecords(templatesTable)
  const templateRecords = (templatesRecords || []).filter((templateRecord) => {
    const templateProjectType = templateTypeFieldId
      ? templateRecord.getCellValue(templateTypeFieldId)
      : null

    if (
      projectType &&
      projectType.length &&
      templateProjectType &&
      templateProjectType.length
    ) {
      return projectType[0].id === templateProjectType[0].id
    }
  })

  const templateDependencies = templateRecords
    ? templateRecords.map((templateRecord) => {
        const dependencies = templateDependencyFieldId
          ? templateRecord.getCellValue(templateDependencyFieldId)
          : null

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
    const newTaskRecords = templateRecords.map((t) => {
      const templateDriver = t.getCellValue(templateDriverFieldId)

      return {
        fields: {
          [tasksNameFieldId]: t.getCellValue(templateStepNameFieldId),
          [tasksProjectFieldId]: [{ id: projectsRecord.id }],
          [tasksOrderFieldId]: t.getCellValue(templateStepOrderFieldId),
          [tasksDurationFieldId]: t.getCellValue(templateDurationFieldId),
          [tasksDriverFieldId]:
            templateDriver && templateDriver.length
              ? [{ id: templateDriver[0].id }]
              : null,
        },
      }
    })

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

    await tasksTable.updateRecordsAsync(recordUpdates)
    // get the project deadline
    // if no project deadline specified, don't set due dates
    // if project deadline is specified, add due dates, starting from the last one
    // augment original fields item so we don't have to refetch the task items to get their orde
    const projectDueDate = projectsRecord.getCellValue(projectDueDateFieldId)
    let taskDueDate = projectDueDate
    const taskDateUpdates = newTaskRecords
      .map((newTaskRecord, idx) => {
        return { ...newTaskRecord, id: newRecords[idx] }
      })
      .sort((a, b) =>
        a.fields[tasksOrderFieldId] > b.fields[tasksOrderFieldId] ? -1 : 1
      )
      .map((newTaskRecord, idx, reversedTaskRecords) => {
        // THIS IS CONFUSING
        // BUT
        // should work
        // instead of returnning the currentTaskRecord, get the previous one
        // and use the total duration of the current (duration + dependencies total duration) to set the due date
        // but that means we won't update the final task record, so we need to add it back afterwards?
        // may be cleaner w/ reduce or something
        const previousTask = reversedTaskRecords[idx + 1]
        if (!previousTask) {
          return {
            id: reversedTaskRecords[0].id,
            fields: {
              [tasksDueDateFieldId]: projectDueDate,
            },
          }
        } else {
          taskDueDate = DateTime.fromISO(taskDueDate)
            .minus({ days: previousTask.fields[tasksDurationFieldId] })
            .toISO()

          return {
            id: previousTask.id,
            fields: {
              [tasksDueDateFieldId]: taskDueDate,
            },
          }
        }
      })

    await tasksTable.updateRecordsAsync(taskDateUpdates)
  }

  const onDeleteTasks = async () => {
    // delete all tasks
    // get all tasks from linked field
    const existingTasks = projectsRecord.getCellValue(projectTasksFieldId)
    await tasksTable.deleteRecordsAsync(existingTasks)
  }

  const onSetDueDate = async (e) => {
    setDueDate(e.target.value)
  }

  const recordCardFields = [
    tasksNameFieldId,
    tasksDueDateFieldId,
    tasksDriverFieldId,
    tasksDependencyFieldId,
    tasksStatusFieldId,
  ].map((fieldId) => tasksTable.getFieldByIdIfExists(fieldId))

  return (
    <Box
      padding={2}
      width="100%"
      display="flex"
      flexDirection="column"
      marginY={2}
    >
      <Heading>✨ Create Tasks from Template </Heading>
      {cursor.selectedRecordIds.length ? (
        <Box>
          <RecordCardList records={[projectsRecord]} height={100} />
          {taskRecords.length ? (
            <Box marginTop={2}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignContent="center"
                marginBottom={2}
              >
                <Heading size="small" marginLeft={2}>
                  Existing Tasks [{taskRecords.length}]
                </Heading>
                {taskRecords.length && (
                  <Button onClick={onDeleteTasks} variant="danger">
                    Delete Existing Tasks
                  </Button>
                )}
              </Box>
              {
                <RecordCardList
                  fields={recordCardFields}
                  records={taskRecords}
                  height={300}
                />
              }
            </Box>
          ) : (
            <></>
          )}
          <Box
            display="flex"
            marginTop={2}
            marginX={2}
            padding={2}
            border="default"
            borderRadius={2}
          >
            <Button onClick={onCreateTasks} marginRight={2}>
              {taskRecords.length
                ? `Create ${templateRecords.length} additional tasks`
                : `Create ${templateRecords.length} tasks`}
            </Button>
            <Input type="date" onChange={onSetDueDate} value={dueDate} />
          </Box>
        </Box>
      ) : (
        "Select project to create tasks"
      )}
    </Box>
  )
}

export default CreateTasksComponent
