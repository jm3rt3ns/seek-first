# kids-story Specification

## Purpose

The last step of the day is for the children: one Bible story, in order from Genesis
to Revelation, with a question to ask them — short enough to do at the table.

## Requirements

### Requirement: Eighty-Five Stories in Canonical Order

The app SHALL carry a fixed list of 85 stories, each a title, a scripture reference,
and one question to ask the children, running from "God Makes Everything" to "Jesus
Will Come Back". The step SHALL show which story of the list this is.

#### Scenario: Story display

- **WHEN** the Kids step is opened
- **THEN** it shows the title, the reference, "Ask them:" with the question, and the
  story's position in the list

### Requirement: The List Advances When the Story Is Read

Marking the Kids step done SHALL move to the next story; "Skip this one" SHALL move
on without marking the step done. The position SHALL wrap to the first story after
the last, so the family can go around again.

#### Scenario: Reading tonight's story

- **WHEN** the reader marks "Read to them"
- **THEN** tomorrow's step shows the next story

#### Scenario: Finishing the list

- **WHEN** the last story is read
- **THEN** the list starts again at Genesis

### Requirement: The Passage Is Optional

Each story's reference SHALL be parseable into scripture text that can be shown in
place, hidden by default. When the reference cannot be parsed or the text cannot be
loaded, the reference alone SHALL stand as the anchor for reading from a Bible or
story Bible.

#### Scenario: Reading from a story Bible

- **WHEN** the family reads from their own book
- **THEN** the step is complete without the text ever being shown

### Requirement: Choosing a Story Directly

Manage SHALL let the reader set the next story from the full list, so a family can
follow along with what their church or story Bible is doing.

#### Scenario: Jumping to Christmas

- **WHEN** the reader selects "Jesus Is Born"
- **THEN** that is the next story, and the list continues from there
