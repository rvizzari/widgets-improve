# Google AI POC

Avaya Workspaces Widgets for Google CC AI POC.

Development made applying best practices, using Typescript and Less.

This is a custom framework to develop Avaya Workspaces Widgets.

## Installing Dependencies

The application relies upon various JS libraries. You can install these by running:

```bash
npm install
```

## Development environment

Code must be done locally and deployed to remote web server.

Workspaces AngularJS application load dynamically the widgets from the web server.

Browser cache must be cleared to load new changes.

### Start development

This task will compile Typescript files and less styles (generating a css for each less file)
Run:

```bash
npm start
```

### Build the widgets

Run:

```bash
npm run build
```

The final code to deployed will be located inside the `bundle/` directory. 

The bundle directory is added in the .gitIgnore file.

### Deploy the widgets

You must must connect to Avaya OpenVPN `vpn-04.experience.avaya.com` to have access to the web server.

Run:

```bash
npm run deploy
# Will ask Password. Password: Avaya123!
```

Credentials and deploy details can be found on file `deploy.sh`

### Test you changes

Open the VMWave web Interface in this URL: https://vmview.experience.avaya.com/portal/webclient/index.html

Machine credentials: `aBaskingRidge04/Symantec01`

#### Workspaces Credentials

Access to Avaya Workspaces in the remote machine browser, URL: http://cluster1.experience.avaya.com:9443

1. Agent: `sBaskingRidge@experience.avaya.com/Symantec01`
1. Admin: `widgetadmin@experience.avaya.com/Avaya123!`

#### Escalate to an agent

You must must connect to Avaya OpenVPN `vpn-04.experience.avaya.com` to have access to the Swagger interface.

URL: https://192.168.3.4:8088/dialogflowconnector/swagger-ui.html

Go to UTILS -> user the Helper API - Create a Conversation

This endpoint hardCode the escalation to `aBaskingRidge` agent.
The response is a (application/text) content type.

Eg. and meaning of those IDs:

```bash
# <conversationID> <participantID>
HcZ1Fs_eRLO_PguKFqhPhA Wc4vcZW4RQ-wphHNK1XWWA
```

You can also try other UC with this profile ID
j2pIcIZnT2eo_gX0vp-xfQ

Use this questions:

What is recommended for someone taking blood thinner like warfarin and experiencing headache along with loss of power in the leg?
or
What is the recommendation to use for a minor headache with some body pain..