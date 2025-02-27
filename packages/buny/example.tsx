/** @jsxImportSource @x2f/buny-core */
import { depends, List, type FC } from "@x2f/buny-core";

const Value: FC<{ name: string, value: string }> = ({ name, value }) => {
  const C = name;
  return <C>{value}</C>
}

const Service: FC<{}> = ({ children }) => {
  return (
    <>
      <kind>Service</kind>
      <apiVersion>v1</apiVersion>
      {children}
    </>
  )
}

const Deployment: FC<{}> = ({ children }) => {
  return (
    // we use Fragment here as its a root-level element
    <>
      <kind>Deployment</kind>
      <apiVersion>apps/v1</apiVersion>
      {children}
    </>
  )
}

const Metadata: FC<{ name: string, namespace?: string }> = ({ name, namespace, children }) => {
  return (
    <metadata>
      <name>{name}</name>
      {namespace && <namespace>{namespace}</namespace>}
      {children}
    </metadata>
  )
}

const Containers: FC<{}> = ({ children }) => {
  return (
    <containers>
      <List>
        {children}
      </List>
    </containers>
  )
}

const Container = (props: { name: string, image: string }) => {
  return (
    <>
      <name>{props.name}</name>
      <image>{props.image}</image>
    </>
  )
}

const Selector = (props: { name: string, value: string }) => {
  return (
    <selector>
      <Value name={props.name} value={props.value} />
    </selector>
  )
}
const Label = (props: { name: string, value: string }) => {
  return (
    <labels>
      <Value name={props.name} value={props.value} />
    </labels>
  )
}

const MyCustomAsyncLabels = async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/users/1')
  const data = await response.json()
  return (
    <labels>
      <username>{data.username}</username>
      <company>{data.company.name}</company>
    </labels>
  )
}

const ImagePullSecrets: FC<{}> = ({ children }) => {
  return (
    <imagePullSecrets>
      <List>
        {children}
      </List>
    </imagePullSecrets>
  )
}

const ImagePullSecret: FC<{name: string}> = ({ name }) => {
  return (
    <>
      <name>{name}</name>
    </>
  )
}


const APISpec = () => {
  return (
    <spec>
      <Containers>
        <Container name="api" image="nginx:oldest" />
        <Container name="db" image="mysql:8" />
      </Containers>
      <ImagePullSecrets>
        <ImagePullSecret name="api-pull-secret" />
      </ImagePullSecrets>
    </spec>
  )
}

const WebSpec = () => {
  return (
    <spec>
      <Containers>
        <Container name="web" image="nginx:latest" />
      </Containers>
      <ImagePullSecrets>
        <ImagePullSecret name="web-pull-secret" />
      </ImagePullSecrets>
    </spec>
  )
}

export const webDeployment = (
  <Deployment>
    <Metadata name="web" namespace="testing" />
    <APISpec />
    <WebSpec />
  </Deployment>
)

export const appDeployment = depends([webDeployment], (
  <Deployment>
    <Metadata name="the-everything-app" namespace="testing">
      <labels>
        <username>John Doe</username>
        <company>Acme Inc.</company>
      </labels>
      <labels>
        <ip>192.168.1.1</ip>
      </labels>
    </Metadata>
    { /* spec is not implemented as a custom component, showing how you can add any arbitrary keys to the object */}
    <spec>
      <replicas>3</replicas>
      <Containers>
        <Container name="web" image="nginx:latest" />
        <Container name="api" image="nginx:oldest" />
      </Containers>
      <Containers>
        <iam>something else</iam>
      </Containers>
    </spec>
  </Deployment>
))

export const appService = depends([appDeployment], (
  <Service>
    <Metadata name="the-everything-app" namespace="testing" />
    <spec>
      <Selector name="app.kubernetes.io/name" value="the-everything-app" />
    </spec>
    <ports>
      <List>{/* List is a symbol, which treats its children as an array instead of as an object, perhaps not the cleanest way but it was quick and works */}
        <>
          <protocol>TCP</protocol>
          <port>80</port>
          <targetPort>8080</targetPort>
        </>
        <>
          <protocol>UDP</protocol>
          <port>53</port>
          <targetPort>53</targetPort>
        </>
      </List>
    </ports>
  </Service>
))
