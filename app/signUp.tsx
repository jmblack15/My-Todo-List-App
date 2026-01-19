import {
  KeyboardAvoidingView,
  Platform,
  Text
} from 'react-native';


export default function SignUp() {
  return (
    <KeyboardAvoidingView
     behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Text>Sign Up Screen</Text>
    </KeyboardAvoidingView>
  )
}