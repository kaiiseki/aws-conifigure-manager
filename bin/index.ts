#!/usr/bin/env node
import chalk from 'chalk'
import { prompt } from 'enquirer'
import fs from 'fs'

const run = async () => {
  const awsDirectoryPath = `${process.env.HOME}/.aws`
  const existAWSDirectory = fs.existsSync(awsDirectoryPath)
  if (!existAWSDirectory) throw new Error('.awsディレクトリが存在しません')

  const credentialFilePath = `${awsDirectoryPath}/credentials`
  const configFilePath = `${awsDirectoryPath}/config`
  const credentialFileBody = fs.readFileSync(credentialFilePath, 'utf8')
  const data = credentialFileBody.match(/\[[\w\s]*\]/g)

  const question2: { profile: string } = await prompt([
    {
      type: 'select',
      name: 'profile',
      message: 'switch元となるprofileを選択してください',
      choices: [...(data?.map((p) => p.slice(1).slice(0, -1)) || []), 'create new credential'],
    },
  ])

  let profile = question2.profile

  if (question2.profile === 'create new credential') {
    const question3: { profile: string; accessKeyId: string; secretAccessKey: string } =
      await prompt([
        {
          type: 'input',
          name: 'profile',
          message: 'profile名を入力してください',
        },
        {
          type: 'input',
          name: 'accessKeyId',
          message: 'アクセスキーIDを入力してください',
        },
        {
          type: 'input',
          name: 'secretAccessKey',
          message: 'シークレットアクセスキーを入力してください',
        },
      ])
    fs.appendFileSync(credentialFilePath, `\n[${question3.profile}]\n`, 'utf8')
    fs.appendFileSync(credentialFilePath, `aws_access_key_id = ${question3.accessKeyId}\n`, 'utf8')
    fs.appendFileSync(
      credentialFilePath,
      `aws_secret_access_key = ${question3.secretAccessKey}`,
      'utf8'
    )
    profile = question3.profile
  }

  const question3: { switchProfileName: string; roleArn: string; mfaSerial: string } = await prompt(
    [
      {
        type: 'input',
        name: 'switchProfileName',
        message: 'switch先となるprofile名を入力してください',
      },
      {
        type: 'input',
        name: 'roleArn',
        message: 'switch先のrole_arnを入力してください',
      },
      {
        type: 'input',
        name: 'mfaSerial',
        message: 'mfa_serialを入力してください',
      },
    ]
  )
  fs.appendFileSync(configFilePath, `\n[profile ${question3.switchProfileName}]\n`, 'utf8')
  fs.appendFileSync(configFilePath, `role_arn = ${question3.roleArn}\n`, 'utf8')
  fs.appendFileSync(configFilePath, `mfa_serial = ${question3.mfaSerial}\n`, 'utf8')
  fs.appendFileSync(configFilePath, `source_profile = ${profile}`, 'utf8')
}

run().catch((e: Error) => console.log(chalk.red(e.message || '', e.stack || '')))
