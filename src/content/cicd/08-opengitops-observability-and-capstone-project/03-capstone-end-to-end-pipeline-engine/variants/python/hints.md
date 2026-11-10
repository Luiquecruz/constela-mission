Keep the stages in the order of the list and return as soon as one fails. A small helper that builds a rejection report from the stage name and the reasons keeps the code short.
---
Two of the building blocks signal problems by throwing (the build order and the identity check). Catch those errors and turn their messages into reasons of the stage where they happened.
---
Fill `passedStages` as the stages pass, so a rejection reports exactly the stages that came before it, and keep the build batches once the build stage has passed.
---
Do not evaluate later stages after a failure. The report is an ordered story of one release, and its first failure is the one to fix.
