# 0001: Record all architecture decisions in one git repository

## STATUS

    Accepted

## CONTEXT

We need to record the architectural decisions made within the AdAction
tech team. We find ourselves falling into two common architectural
antipatterns: the *Groundhog Day* and *Email-driven Architecture*
antipatterns. The team needs visibility to the architectural decisions and
the context behind those choices. This needs to be documented in a
central and discoverable location.

### Considered Options
 * Store decisions as ADRs using a simple markdown template in a git
   repository
 * Use an adr management tool to manage the ADR documents
 * Use wiki pages within confluence

## DECISION

CHOSEN OPTION: Store decisions as ADRs using a simple markdown template

We will document those decisions using Architecture Decision Records
(ADRs). An ADR is a short document that describes a significant
decision along with its context, consequences, and alternatives. In
addition to documenting new decisions, we will also document any
existing decisions that have not been recorded. ADRs will be stored in
a git repository and will be versioned.

A [template](../../template/number-adr-title-template.md) is provided
for creating new ADRs. The ADR file should be named `<adr incrementing
number>-snake-case-title.md`. Newly proposed ADRs will be submitted as
pull requests and will be reviewed by the tech team. PRs should be
titled as `docs(ADR-####): <Description>`. Once approved, the ADR will
be merged into the repository. An ADR should be generated for any
*architecturally significant* decision.

Using this approach, an AdAction engineer will know exactly where they
can look to understand the current architecture of our systems.  If
they should need a change, or wish to propose a new architecturally
significant decision, we will have a clear process in place.

Using this approach will provide a consistent structure with history
while not being bogged down with tooling.

### Repo Structure

The "code" in this repo will be housed in the following structure:
```plaintext
  - docs
    - architecture-decision-records
      - application
        - adgem
        - cosmic
        - etc.
      - shared
    - templates
```

## CONSEQUENCES

This new process will first be announced for review in the #engineers
channel on slack. Upon approval of this ADR, teams are required to
submit an ADR PR for all architecturally significant decisions their
teams may make.

Architecturally significant decisions are defined as those decisions
that affect the structure, nonfunctional characteristics,
dependencies, interfaces, or construction techniques of a system(s).

Legacy decisions requiring ADR documentation will be tracked as GitHub
issues on this repository.

PRs to this repo will require 2 approvals before acceptance. One
approval from a team member of the author, and one approval from a
member of architecture oversight (team leads or VP of engineering).

In the event of disagreements or conflicts during the PR review
process that cannot be resolved through team discussion and consensus,
the matter will be escalated to the VP of Engineering. The VP of
Engineering will review the points of contention and make the final
decision, ensuring alignment with the organization's architectural
principles and strategic goals. This process underscores the
importance of collaborative resolution while providing a clear path
for decision-making authority.

### Risks
The primary risk is that the process will be seen as too heavy and
onerous. It is deemed the benefits will outweigh this.

## NOTES

### References
- [Fundamentals of Software Architecture: An Engineering Approach](https://www.amazon.com/Fundamentals-Software-Architecture-Comprehensive-Characteristics/dp/1492043451) - Chapter 19
- [Architecture Decision Records](https://adr.github.io/)

### Original Author
    Ron White

### Approval date

### Approved by
