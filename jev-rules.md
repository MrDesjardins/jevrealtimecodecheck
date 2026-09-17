# Function Size
Function should always be under 20 lines of code

# Variable name
All variables must be short, the shorter the better
``
const a = 1; // VERY good
const a_b_c_d_e = 34 // Not so much
const a_b_d_d_e_f_g_h_i // Too long
`` 

# Usage of const and let
The code must use const as much as possible, then let.

# No console statements
Code must not contain `console.log`, `console.debug`, or `console.info`
calls. Use a proper logger, or remove them before committing.

# No explicit any type
TypeScript code must not use the `any` type. Use a specific type, `unknown`,
or a generic parameter instead.

# No commented-out code
Do not leave blocks of commented-out code. Delete code that is no longer
used instead of commenting it out.

# TODO comments need a reference
Any `TODO` or `FIXME` comment must include a ticket/issue reference, for
example `TODO(JIRA-123): ...`. A bare `TODO` or `FIXME` with no reference is
a violation.

# No empty catch blocks
A `catch` block must not be empty. It must handle the error, log it, or
rethrow it.