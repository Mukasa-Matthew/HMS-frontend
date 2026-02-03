import * as React from 'react';
import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

export interface ButtonProps extends Omit<ChakraButtonProps, 'leftIcon' | 'rightIcon'> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <ChakraButton ref={ref} leftIcon={leftIcon} rightIcon={rightIcon} {...props}>
        {children}
      </ChakraButton>
    );
  }
);

Button.displayName = 'Button';
